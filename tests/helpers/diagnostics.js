import { analyzeError } from './classifiers.js';

export class Diagnostics {
  constructor(page) {
    this.page = page;
    this.errors = [];
  }

  start() {
    this.page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error' || type === 'warn') {
        const diagnosis = analyzeError({ message: text });
        const classification = diagnosis.classificacao;
        if (classification !== 'RUIDO_EXTENSAO_IGNORAVEL') {
          this.errors.push({ type: 'console', message: text, classification, diagnosis });
        }
      }
    });

    this.page.on('pageerror', err => {
      const text = err.message;
      const diagnosis = analyzeError({ message: text });
      const classification = diagnosis.classificacao;
      if (classification !== 'RUIDO_EXTENSAO_IGNORAVEL') {
        this.errors.push({ type: 'pageerror', message: text, classification, diagnosis });
      }
    });

    this.page.on('response', async response => {
      if (response.url().includes('supabase.co')) {
        const status = response.status();
        const request = response.request();
        const method = request.method();
        
        let payload = null;
        if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
          payload = request.postDataJSON() || request.postData();
        }

        if (status >= 400 && status !== 404) { // Evita falsos positivos em minor 404s
          try {
            const body = await response.json();
            const errorMsg = `HTTP ${status}: ${JSON.stringify(body)}`;
            const diagnosis = analyzeError({
              message: errorMsg,
              responseBody: body,
              payload,
              url: response.url(),
              method
            });
            let classification = diagnosis.classificacao;
            
            this.errors.push({
              type: 'network',
              message: errorMsg,
              classification,
              diagnosis,
              status,
              url: response.url(),
              method,
              payload,
              responseBody: body
            });
          } catch (e) {
            // Ignora erro de parsing JSON de corrompidos ou vazios
          }
        }
      }
    });
  }

  getErrors() {
    return this.errors;
  }
}
