(function () {
  // Highlight active nav item based on body[data-page]
  const page = document.body.getAttribute("data-page");
  if (page) {
    document.querySelectorAll("[data-nav]").forEach(a => {
      if (a.getAttribute("data-nav") === page) a.classList.add("is-active");
    });
  }

  // Drawer open/close
  const drawer = document.querySelector("[data-drawer]");
  const openDrawer = () => drawer && drawer.classList.add("is-open");
  const closeDrawer = () => drawer && drawer.classList.remove("is-open");

  document.addEventListener("click", (e) => {
    const t = e.target;

    // Open item -> drawer
    if (t.matches('[data-action="open-item"]')) {
      openDrawer();
    }
    if (t.matches("[data-close-drawer]")) {
      closeDrawer();
    }

    // Analyze -> simulate scanning then update drawer (very lightweight demo)
    if (t.matches('[data-action="analyze"]')) {
      openDrawer();

      const riskEl = drawer?.querySelector('[data-dynamic="risk"]');
      const confEl = drawer?.querySelector('[data-dynamic="confidence"]');
      const explainEl = drawer?.querySelector('[data-dynamic="explain"]');
      const signalsEl = drawer?.querySelector('[data-dynamic="signals"]');

      if (riskEl && confEl && explainEl && signalsEl) {
        riskEl.textContent = "Scanning…";
        riskEl.className = "badge badge--info";
        confEl.textContent = "Confidence: Checking…";
        explainEl.textContent = "Analyzing screenshot for scam patterns (urgency, impersonation, payment pressure)…";
        signalsEl.innerHTML = `<span class="chip chip--warn">Analyzing</span>`;

        window.setTimeout(() => {
          // Pick a mock result
          const results = [
            {
              riskText: "High Risk",
              riskClass: "badge badge--danger",
              conf: "Confidence: High",
              explain:
                "This content pressures you to act quickly and may impersonate a trusted institution. Pause and verify using official contact details.",
              signals: ["Urgency", "Fear/Threat", "Impersonation", "Payment pressure"]
            },
            {
              riskText: "Medium Risk",
              riskClass: "badge badge--warn",
              conf: "Confidence: Medium",
              explain:
                "This content includes suspicious link behavior and unclear sender identity. Verify before clicking or paying.",
              signals: ["Unclear sender", "Link risk", "Time pressure"]
            },
            {
              riskText: "Low Risk",
              riskClass: "badge badge--success",
              conf: "Confidence: Medium",
              explain:
                "No strong scam signals detected. Still avoid sharing codes or personal data and verify if you feel pressured.",
              signals: ["No strong signals", "General caution"]
            }
          ];

          const r = results[Math.floor(Math.random() * results.length)];
          riskEl.textContent = r.riskText;
          riskEl.className = r.riskClass;
          confEl.textContent = r.conf;
          explainEl.textContent = r.explain;

          signalsEl.innerHTML = r.signals
            .map(s => {
              const kind = r.riskText === "High Risk" ? "chip--danger" : (r.riskText === "Medium Risk" ? "chip--warn" : "");
              return `<span class="chip ${kind}">${s}</span>`;
            })
            .join("");
        }, 900);
      }
    }

    // Filters (scan.html)
    if (t.matches("[data-filter]")) {
      document.querySelectorAll("[data-filter]").forEach(b => b.classList.remove("is-active"));
      t.classList.add("is-active");

      const key = t.getAttribute("data-filter");
      const rows = document.querySelectorAll(".table__row[data-status]");
      rows.forEach(row => {
        if (key === "all") row.style.display = "";
        else row.style.display = (row.getAttribute("data-status") === key) ? "" : "none";
      });
    }

    // Mock add item (scan.html) — just shows a friendly alert
    if (t.matches('[data-action="mock-add-item"]')) {
      alert("Mock capture added to Inbox. (Prototype) Now click Analyze on an item to see results.");
    }

    // Modal open/close
    if (t.matches("[data-open]")) {
      const id = t.getAttribute("data-open");
      const modal = document.querySelector(`[data-modal="${id}"]`);
      modal?.classList.add("is-open");
      modal?.setAttribute("aria-hidden", "false");
    }

    if (t.matches("[data-close-modal]") || t.matches(".modal__backdrop")) {
      const modal = t.closest(".modal") || document.querySelector(".modal.is-open");
      modal?.classList.remove("is-open");
      modal?.setAttribute("aria-hidden", "true");
    }
  });

  // ESC to close drawer/modals
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDrawer();
      document.querySelectorAll(".modal.is-open").forEach(m => {
        m.classList.remove("is-open");
        m.setAttribute("aria-hidden", "true");
      });
    }
  });
})();