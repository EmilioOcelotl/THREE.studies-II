import { GrainEngine } from '../../treslib/src/GrainEngine.js';
import { GrainSequencer } from '../../treslib/src/GrainSequencer.js';
import * as app from './index.js';

const history = [];
let historyIndex = -1;

function getScope() {
    return {
        g1: app.g1,
        g2: app.g2,
        seq: app.seq,
        audioCtx: app.audioCtx,
        hydraSelect: app.hydraSelect,
        GrainEngine,
        GrainSequencer,
    };
}

function evalInScope(code) {
    const scope = getScope();
    // Advertir si g1/g2/seq aún no están listos
    if (/\bg1\b/.test(code) && scope.g1 === null) {
        log('✗ g1 no está listo — espera a que cargue el audio');
        return;
    }
    if (/\bg2\b/.test(code) && scope.g2 === null) {
        log('✗ g2 no está listo');
        return;
    }
    if (/\bseq\b/.test(code) && scope.seq === null) {
        log('✗ seq no está listo — espera a que cargue el audio');
        return;
    }
    const keys   = Object.keys(scope);
    const values = Object.values(scope);
    try {
        const fn = new Function(...keys, `"use strict"; return (${code})`);
        const result = fn(...values);
        const display = result !== undefined ? JSON.stringify(result) : 'ok';
        log('✓ ' + display);
    } catch (_) {
        try {
            const fn = new Function(...keys, `"use strict"; ${code}`);
            fn(...values);
            log('✓ ok');
        } catch (err) {
            log('✗ ' + err.message);
        }
    }
}

function log(msg) {
    const logEl = document.getElementById('repl-log');
    if (!logEl) return;
    const line = document.createElement('div');
    line.className = msg.startsWith('✗') ? 'repl-error' : 'repl-ok';
    line.textContent = msg;
    logEl.appendChild(line);
    // Mantener máximo 80 líneas
    while (logEl.children.length > 80) logEl.removeChild(logEl.firstChild);
    logEl.scrollTop = logEl.scrollHeight;
}

export function setupREPL() {
    const panel   = document.getElementById('repl');
    const input   = document.getElementById('repl-input');
    const infoBtn = document.getElementById('repl-info-btn');
    const infoEl  = document.getElementById('repl-info');
    if (!panel || !input) return;

    // Toggle panel de info
    infoBtn.addEventListener('click', () => {
        infoEl.classList.toggle('repl-info-hidden');
        infoBtn.classList.toggle('active');
    });

    // Ctrl+Enter → evaluar
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            const code = input.value.trim();
            if (!code) return;
            history.unshift(code);
            historyIndex = -1;
            log('> ' + code);
            evalInScope(code);
            input.value = '';
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex < history.length - 1) {
                historyIndex++;
                input.value = history[historyIndex];
                // Mover cursor al final
                setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
            }
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                input.value = history[historyIndex];
            } else {
                historyIndex = -1;
                input.value = '';
            }
            return;
        }
    });

    // Tab (fuera del textarea) → toggle panel
    document.addEventListener('keydown', e => {
        if (e.key === 'Tab' && document.activeElement !== input) {
            e.preventDefault();
            panel.classList.toggle('repl-hidden');
            if (!panel.classList.contains('repl-hidden')) input.focus();
        }
    });

    // Notificación cuando g1 esté listo
    window.addEventListener('g1ready', () => {
        log('// g1 + seq listos');
    });

    // Mensaje de bienvenida
    log('// THREE.studies-II — control');
    log('// g1.start()  g1.setPointer(0.5)  hydraSelect(2)');
    log('// Tab: ocultar/mostrar');
}
