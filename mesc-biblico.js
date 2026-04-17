/**
 * Mensagens com citação católica: Sagrada Escritura (tradição CNBB) e santos / magistério.
 */
(function () {
    var VERSOS = [
        { ref: "Lc 22,19", txt: "Fazei isto em memória de mim." },
        { ref: "Jo 6,51", txt: "Eu sou o pão vivo descido do céu." },
        { ref: "1Cor 11,26", txt: "Todas as vezes que comereis deste pão e beberdes do cálice, anunciais a morte do Senhor, até que ele venha." },
        { ref: "Col 3,23", txt: "Tudo o que fizerdes, fazei-o de todo o coração, como para o Senhor." },
        { ref: "Mt 25,40", txt: "Todas as vezes que o fizestes a um destes meus pequeninos irmãos, a mim o fizestes." },
        { ref: "Sl 116,12-13", txt: "Que retribuirei ao Senhor por tudo o que ele me fez? Erguerei o cálice da salvação e invocarei o nome do Senhor." },
        { ref: "São Francisco de Assis (oração)", txt: "Senhor, fazei de mim um instrumento da vossa paz." },
        { ref: "Santa Teresa de Ávila", txt: "Não há descanso até o descanso que se acha junto de Deus." },
        { ref: "Santa Teresinha do Menino Jesus", txt: "Quero passar o Céu a fazer o bem na terra." },
        { ref: "São João Paulo II", txt: "Não tenham medo de ser santos." },
        { ref: "São João Maria Vianney", txt: "O sacerdócio é o amor do coração de Jesus." },
        { ref: "Santa Faustina (Diário)", txt: "Jesus, eu confio em vós." },
        { ref: "São Padre Pio", txt: "A oração é a melhor arma que temos; é uma chave que abre o coração de Deus." },
        { ref: "São Domingos de Gusmão", txt: "Terás o que pedires em oração, se pedires com fé." },
        { ref: "São José (Mt 1,24)", txt: "José fez conforme o anjo do Senhor lhe ordenara." },
        { ref: "São Lucas 1,38", txt: "Eis aqui a serva do Senhor; cumpra-se em mim segundo a tua palavra." },
        { ref: "Catecismo (n. 1324)", txt: "A Eucaristia é o sumo e o fundamento de toda a vida cristã." },
        { ref: "São Bernardo", txt: "O amor é o único motivo para o que fazeis." },
        { ref: "São Tomás de Aquino", txt: "A fé é o princípio de toda a vida sobrenatural." },
        { ref: "São Bento", txt: "Ora et labora — ora e trabalha." },
        { ref: "São João Crisóstomo", txt: "Não podes encontrar Jesus sem a Cruz." },
        { ref: "Santa Catarina de Sena", txt: "Se estás o que deves ser, farás que os outros sejam o que devem ser." },
        { ref: "Papa Francisco (EG)", txt: "Cristo é a luz que brilha na escuridão." },
        { ref: "Is 41,10", txt: "Não temas, porque estou contigo." },
        { ref: "Fil 4,13", txt: "Tudo posso naquele que me fortalece." },
        { ref: "Jo 14,27", txt: "Deixo-vos a paz, a minha paz vos dou." },
        { ref: "Rom 8,28", txt: "Tudo concorre para o bem daqueles que amam a Deus." },
        { ref: "SIR 2,10", txt: "Olha para as gerações passadas e vê: quem confiou no Senhor foi decepcionado?" }
    ];

    function estilo() {
        if (document.getElementById("mesc-biblico-style")) return;
        var s = document.createElement("style");
        s.id = "mesc-biblico-style";
        s.textContent =
            "#mesc-overlay-biblico{position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;}" +
            "#mesc-overlay-biblico .mesc-box{background:#fff;border-radius:16px;max-width:400px;width:100%;padding:22px;box-shadow:0 20px 50px rgba(0,0,0,.2);font-family:Segoe UI,sans-serif;}" +
            "#mesc-overlay-biblico .mesc-box h3{margin:0 0 10px;font-size:17px;color:#1e3a8a;}" +
            "#mesc-overlay-biblico .mesc-box p.msg{margin:0 0 14px;font-size:15px;line-height:1.45;color:#334155;}" +
            "#mesc-overlay-biblico .mesc-citacao{border-left:4px solid #7c2d12;padding:10px 12px;background:#fff7ed;margin:12px 0;border-radius:0 8px 8px 0;}" +
            "#mesc-overlay-biblico .mesc-citacao small{display:block;color:#9a3412;font-weight:700;margin-bottom:4px;font-size:12px;}" +
            "#mesc-overlay-biblico .mesc-citacao span{font-size:14px;color:#431407;line-height:1.45;}" +
            "#mesc-overlay-biblico .mesc-btn{width:100%;padding:14px;border:none;border-radius:12px;background:#1e3a8a;color:#fff;font-weight:bold;font-size:15px;cursor:pointer;margin-top:8px;}" +
            "#mesc-overlay-biblico .mesc-btn.erro{background:#b91c1c;}";
        document.head.appendChild(s);
    }

    function pickVerso() {
        return VERSOS[Math.floor(Math.random() * VERSOS.length)];
    }

    window.mescModal = function (mensagem, isErro, titulo) {
        estilo();
        var old = document.getElementById("mesc-overlay-biblico");
        if (old) old.remove();
        var v = pickVerso();
        var ov = document.createElement("div");
        ov.id = "mesc-overlay-biblico";
        ov.innerHTML =
            '<div class="mesc-box" role="dialog" aria-modal="true">' +
            "<h3>" + (titulo || (isErro ? "Atenção" : "MESC")) + "</h3>" +
            '<p class="msg"></p>' +
            '<div class="mesc-citacao"><small>' + v.ref + "</small><span>«" + v.txt + "»</span></div>" +
            '<button type="button" class="mesc-btn' + (isErro ? " erro" : "") + '" id="mesc-fechar-biblico">Amém</button>' +
            "</div>";
        ov.querySelector(".msg").textContent = mensagem;
        document.body.appendChild(ov);
        function fechar() {
            ov.remove();
        }
        ov.querySelector("#mesc-fechar-biblico").onclick = fechar;
        ov.addEventListener("click", function (e) {
            if (e.target === ov) fechar();
        });
    };

    window.mescAlert = function (msg, isErro) {
        window.mescModal(msg, !!isErro);
    };

    window.mescConfirm = function (mensagem, onConfirm, titulo) {
        estilo();
        var old = document.getElementById("mesc-overlay-biblico");
        if (old) old.remove();
        var v = pickVerso();
        var ov = document.createElement("div");
        ov.id = "mesc-overlay-biblico";
        ov.innerHTML =
            '<div class="mesc-box" role="dialog" aria-modal="true">' +
            "<h3>" + (titulo || "Confirmar") + "</h3>" +
            '<p class="msg"></p>' +
            '<div class="mesc-citacao"><small>' + v.ref + "</small><span>«" + v.txt + "»</span></div>" +
            '<div style="display:flex;gap:8px;margin-top:8px;">' +
            '<button type="button" class="mesc-btn" id="mesc-cancelar-biblico" style="background:#64748b;margin-top:0;">Cancelar</button>' +
            '<button type="button" class="mesc-btn erro" id="mesc-confirmar-biblico" style="margin-top:0;">Confirmar</button>' +
            "</div>" +
            "</div>";
        ov.querySelector(".msg").textContent = mensagem;
        document.body.appendChild(ov);
        function fechar() { ov.remove(); }
        ov.querySelector("#mesc-cancelar-biblico").onclick = fechar;
        ov.querySelector("#mesc-confirmar-biblico").onclick = function () {
            fechar();
            if (typeof onConfirm === "function") onConfirm();
        };
        ov.addEventListener("click", function (e) {
            if (e.target === ov) fechar();
        });
    };
})();
