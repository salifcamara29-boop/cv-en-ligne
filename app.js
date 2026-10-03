/**
 * IZI CV PRO - Application Logic
 * Comptable & Contrôleur de Gestion
 * Live Edit Mode, Theme Switcher, PDF Export, Project Modals, 3D Tilt
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all subsystems
  initThemeAndAccents();
  initLiveEditEngine();
  initProjectModals();
  initFilters();
  initTimelineToggle();
  initCounters();
  initCard3DTilt();
  initContactForm();
  initMobileDrawer();
  initPrintExport();
});

/* ==========================================================================
   1. THEME & COLOR ACCENT SYSTEM
   ========================================================================== */
function initThemeAndAccents() {
  const htmlEl = document.documentElement;
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const colorPickerBtn = document.getElementById('colorPickerBtn');
  const colorOptionsMenu = document.getElementById('colorOptionsMenu');
  const colorOptions = document.querySelectorAll('.color-option');

  // Load saved theme (default dark)
  const savedTheme = localStorage.getItem('izicv_theme') || 'dark';
  htmlEl.setAttribute('data-theme', savedTheme);

  // Load saved accent (default emerald)
  const savedAccent = localStorage.getItem('izicv_accent') || 'emerald';
  htmlEl.setAttribute('data-accent', savedAccent);

  // Theme toggle click
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = htmlEl.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      htmlEl.setAttribute('data-theme', newTheme);
      localStorage.setItem('izicv_theme', newTheme);
      showToast(`Mode ${newTheme === 'dark' ? 'Sombre' : 'Clair'} activé`);
    });
  }

  // Toggle color menu
  if (colorPickerBtn && colorOptionsMenu) {
    colorPickerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      colorOptionsMenu.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      colorOptionsMenu.classList.remove('show');
    });
  }

  // Select accent color
  colorOptions.forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      const color = opt.getAttribute('data-color');
      htmlEl.setAttribute('data-accent', color);
      localStorage.setItem('izicv_accent', color);
      colorOptionsMenu.classList.remove('show');
      showToast(`Ambiance couleur mise à jour : ${opt.title}`);
    });
  });
}

/* ==========================================================================
   2. LIVE EDIT MODE ENGINE (INLINE EDITING + LOCALSTORAGE)
   ========================================================================== */
function initLiveEditEngine() {
  const toggleEditBtn = document.getElementById('toggleEditModeBtn');
  const headerEditBtn = document.getElementById('headerEditBtn');
  const headerEditText = document.getElementById('headerEditText');
  const editBanner = document.getElementById('editModeBanner');
  const closeEditBannerBtn = document.getElementById('closeEditBannerBtn');
  const resetDataBtn = document.getElementById('resetDataBtn');
  const exportDataBtn = document.getElementById('exportDataBtn');
  const avatarFileInput = document.getElementById('avatarFileInput');
  const profileAvatarImg = document.getElementById('profileAvatarImg');
  const editableElements = document.querySelectorAll('[data-edit-key]');

  let isEditMode = false;

  // Restore saved edits from localStorage
  const savedEdits = JSON.parse(localStorage.getItem('izicv_content_edits') || '{}');
  editableElements.forEach(el => {
    const key = el.getAttribute('data-edit-key');
    if (savedEdits[key]) {
      el.innerHTML = savedEdits[key];
    }
  });

  // Restore custom avatar if saved
  const savedAvatar = localStorage.getItem('izicv_custom_avatar');
  if (savedAvatar && profileAvatarImg) {
    profileAvatarImg.src = savedAvatar;
  }

  // Sync print header fields
  syncPrintFields();

  function setEditMode(active) {
    isEditMode = active;
    document.body.classList.toggle('edit-active', isEditMode);
    if (editBanner) editBanner.classList.toggle('active', isEditMode);
    if (toggleEditBtn) toggleEditBtn.classList.toggle('active', isEditMode);
    if (headerEditText) headerEditText.textContent = isEditMode ? 'Terminer Édition' : 'Éditer le CV';

    editableElements.forEach(el => {
      el.contentEditable = isEditMode ? 'true' : 'false';
    });

    if (isEditMode) {
      showToast('✏️ Mode édition activé : modifiez les textes directement !');
    } else {
      showToast('✅ Modifications enregistrées avec succès.');
      syncPrintFields();
    }
  }

  // Toggle events
  if (toggleEditBtn) {
    toggleEditBtn.addEventListener('click', () => setEditMode(!isEditMode));
  }
  if (headerEditBtn) {
    headerEditBtn.addEventListener('click', () => setEditMode(!isEditMode));
  }
  if (closeEditBannerBtn) {
    closeEditBannerBtn.addEventListener('click', () => setEditMode(false));
  }

  // Auto-save on blur or input
  editableElements.forEach(el => {
    el.addEventListener('blur', () => {
      if (!isEditMode) return;
      const key = el.getAttribute('data-edit-key');
      savedEdits[key] = el.innerHTML;
      localStorage.setItem('izicv_content_edits', JSON.stringify(savedEdits));
      syncPrintFields();
    });
  });

  // Reset to default
  if (resetDataBtn) {
    resetDataBtn.addEventListener('click', () => {
      if (confirm('Voulez-vous vraiment réinitialiser tous vos textes et restaurer le contenu par défaut ?')) {
        localStorage.removeItem('izicv_content_edits');
        localStorage.removeItem('izicv_custom_avatar');
        showToast('Données réinitialisées. Rechargement...');
        setTimeout(() => location.reload(), 600);
      }
    });
  }

  // Export JSON
  if (exportDataBtn) {
    exportDataBtn.addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedEdits, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "mon_cv_salif_compta.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Fichier JSON exporté !');
    });
  }

  // Change Profile Photo Upload
  if (avatarFileInput && profileAvatarImg) {
    avatarFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 3 * 1024 * 1024) {
          showToast('⚠️ Image trop volumineuse (max 3Mo).');
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          profileAvatarImg.src = event.target.result;
          try {
            localStorage.setItem('izicv_custom_avatar', event.target.result);
            showToast('📸 Photo de profil mise à jour !');
          } catch (err) {
            showToast('⚠️ Stockage local plein, photo visible pour cette session.');
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

// Synchronize editable hero data to print layout
function syncPrintFields() {
  const heroName = document.querySelector('[data-edit-key="hero_name"]');
  const heroJob = document.querySelector('[data-edit-key="hero_job_title"]');
  const heroBio = document.querySelector('[data-edit-key="hero_bio"]');
  const printName = document.getElementById('printName');
  const printJobTitle = document.getElementById('printJobTitle');
  const printBio = document.getElementById('printBio');

  if (heroName && printName) printName.textContent = heroName.textContent.trim();
  if (heroJob && printJobTitle) printJobTitle.textContent = heroJob.textContent.trim();
  if (heroBio && printBio) printBio.textContent = heroBio.textContent.trim();
}

/* ==========================================================================
   3. PRINT & PDF EXPORT
   ========================================================================== */
function initPrintExport() {
  const printCvBtn = document.getElementById('printCvBtn');
  const heroPrintBtn = document.getElementById('heroPrintBtn');
  const contactPrintBtn = document.getElementById('contactPrintBtn');
  const drawerPrintBtn = document.getElementById('drawerPrintBtn');

  function triggerPrint() {
    syncPrintFields();
    showToast('📄 Préparation du CV au format PDF...');
    setTimeout(() => {
      window.print();
    }, 400);
  }

  [printCvBtn, heroPrintBtn, contactPrintBtn, drawerPrintBtn].forEach(btn => {
    if (btn) btn.addEventListener('click', triggerPrint);
  });
}

/* ==========================================================================
   4. SKILLS & PROJECTS FILTERS
   ========================================================================== */
function initFilters() {
  // Skills filter
  const skillTabs = document.querySelectorAll('.skills-filter-nav .filter-tab');
  const skillCards = document.querySelectorAll('#skillsGrid .skill-card');

  skillTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      skillTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filter = tab.getAttribute('data-filter');

      skillCards.forEach(card => {
        const cat = card.getAttribute('data-category');
        if (filter === 'all' || cat === filter) {
          card.style.display = 'block';
          card.style.animation = 'scaleUp 0.3s ease';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Projects filter
  const projTabs = document.querySelectorAll('.project-filter-bar .proj-tab');
  const projCards = document.querySelectorAll('#projectsGrid .project-card');

  projTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      projTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filter = tab.getAttribute('data-filter');

      projCards.forEach(card => {
        const cat = card.getAttribute('data-category');
        if (filter === 'all' || cat === filter) {
          card.style.display = 'flex';
          card.style.animation = 'scaleUp 0.3s ease';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* ==========================================================================
   5. TIMELINE TABS (EXPÉRIENCES vs FORMATIONS)
   ========================================================================== */
function initTimelineToggle() {
  const tabExpBtn = document.getElementById('tabExpBtn');
  const tabEduBtn = document.getElementById('tabEduBtn');
  const expTimeline = document.getElementById('experienceTimeline');
  const eduTimeline = document.getElementById('educationTimeline');

  if (!tabExpBtn || !tabEduBtn) return;

  tabExpBtn.addEventListener('click', () => {
    tabExpBtn.classList.add('active');
    tabEduBtn.classList.remove('active');
    expTimeline.classList.remove('d-none');
    eduTimeline.classList.add('d-none');
    expTimeline.style.animation = 'fadeIn 0.35s ease';
  });

  tabEduBtn.addEventListener('click', () => {
    tabEduBtn.classList.add('active');
    tabExpBtn.classList.remove('active');
    eduTimeline.classList.remove('d-none');
    expTimeline.classList.add('d-none');
    eduTimeline.style.animation = 'fadeIn 0.35s ease';
  });
}

/* ==========================================================================
   6. PROJECT MODALS (CASE STUDIES IN-DEPTH)
   ========================================================================== */
const projectData = {
  p1: {
    title: "Dashboard de Pilotage Trésorerie & KPI en Temps Réel",
    category: "Digitalisation & Business Intelligence",
    date: "2023 - 2024",
    client: "Groupe Retail & Distribution",
    image: "assets/project-bi.jpg",
    challenge: "La direction générale recevait les arrêtés de trésorerie avec 72h de décalage via des tableurs Excel manuels sujets à des erreurs de formules. Les prévisions budgétaires à 3 mois manquaient de visibilité.",
    solution: "Mise en place d'un pipeline complet Power BI connecté aux exports comptables automatisés de Sage 100 via Power Query. Modélisation de flux d'encaissement et décaissement en temps réel avec alertes sur les dépassements de lignes de découvert.",
    tools: ["Power BI", "DAX", "Sage 100", "Excel Power Query", "VBA"],
    metrics: [
      { val: "-80%", label: "Temps de reporting" },
      { val: "32 M€", label: "Flux analysés" },
      { val: "100%", label: "Automatisation" }
    ],
    deliverables: [
      "Tableau de bord interactif accessible sur tablette pour le DAF et le DG",
      "Module de prévision de cash-flow glissant sur 13 semaines",
      "Guide d'utilisation et formation dispensée aux équipes internes"
    ]
  },
  p2: {
    title: "Accélération et Fiabilisation de la Clôture Annuelle",
    category: "Audit & Clôture Comptable",
    date: "2022 - 2023",
    client: "Cabinet d'Ingénierie & IT",
    image: "assets/project-erp.jpg",
    challenge: "Les clôtures annuelles s'étiraient sur plus de 12 jours après la fin du mois, causant un retard sur les déclarations fiscales et des frictions avec les auditeurs légaux.",
    solution: "Refonte intégrale du calendrier de clôture (Fast-Close) : checklists standardisées par cycle comptable, anticipation des écritures d'inventaire dès J-5, automatisation du calcul des FAE/CCA et mise en place d'un classeur de révision digitalisé prêt pour le CAC.",
    tools: ["Cegid Quadra", "Liasse 2065", "Excel Avancé", "Normes PCG", "Audit Légal"],
    metrics: [
      { val: "J+4", label: "Délai de clôture final" },
      { val: "0", label: "Anomalie relevée au bilan" },
      { val: "+100%", label: "Conformité fiscale" }
    ],
    deliverables: [
      "Dossier de révision comptable normé et indexé pour les auditeurs",
      "Réduction de 8 jours sur le délai de validation du bilan",
      "Élimination totale des pénalités pour déclarations tardives"
    ]
  },
  p3: {
    title: "Optimisation du BFR & Réduction Drastique du DSO",
    category: "Trésorerie & Gestion Financière",
    date: "2021 - 2022",
    client: "Société de Services Multi-Sites",
    image: "assets/project-bi.jpg",
    challenge: "Le besoin en fonds de roulement était dégradé par un DSO (Days Sales Outstanding) de 68 jours, générant des tensions régulières de liquidité en milieu de mois.",
    solution: "Segmentation de la balance âgée par niveau de risque, automatisation des relances amiables à J+1 et J+15, et mise en place d'un protocole d'escompte pour paiement anticipé auprès des grands comptes.",
    tools: ["Balance Âgée", "Gestion du BFR", "Négociation Bancaire", "Excel VBA", "Agicap"],
    metrics: [
      { val: "-27 jours", label: "Réduction du DSO" },
      { val: "+180 k€", label: "Trésorerie débloquée" },
      { val: "41 jours", label: "Délai moyen final" }
    ],
    deliverables: [
      "Processus de relance préventif avant échéance",
      "Indicateur hebdomadaire de recouvrement partagé avec la force commerciale",
      "Économie substantielle sur les agios et facilités de caisse"
    ]
  }
};

function initProjectModals() {
  const modal = document.getElementById('projectModal');
  const modalContent = document.getElementById('modalContent');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const projectCards = document.querySelectorAll('.project-card');

  if (!modal || !modalContent) return;

  projectCards.forEach(card => {
    const openBtn = card.querySelector('.open-project-modal-btn');
    const projId = card.getAttribute('data-project-id');

    if (openBtn && projId && projectData[projId]) {
      openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openModalWithData(projectData[projId]);
      });
    }
  });

  function openModalWithData(data) {
    modalContent.innerHTML = `
      <div class="modal-project-view">
        <span class="section-tag">${data.category}</span>
        <h2 style="font-family: var(--font-heading); font-size: 1.85rem; margin: 0.5rem 0 0.75rem; color: var(--text-main);">${data.title}</h2>
        <div style="font-size: 0.9rem; color: var(--accent-primary); font-weight: 600; margin-bottom: 1.5rem;">
          ${data.client} • Réalisé en ${data.date}
        </div>

        <div style="margin-bottom: 1.5rem; border-radius: var(--radius-md); overflow: hidden; max-height: 280px;">
          <img src="${data.image}" alt="${data.title}" style="width: 100%; height: 100%; object-fit: cover;">
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; background: var(--bg-surface-elevated); padding: 1.25rem; border-radius: var(--radius-sm); border: 1px solid var(--border-glass);">
          ${data.metrics.map(m => `
            <div style="text-align: center;">
              <strong style="font-family: var(--font-heading); font-size: 1.5rem; color: var(--accent-primary); display: block;">${m.val}</strong>
              <small style="font-size: 0.75rem; color: var(--text-subtle);">${m.label}</small>
            </div>
          `).join('')}
        </div>

        <div style="margin-bottom: 1.5rem;">
          <h4 style="font-size: 1.1rem; color: var(--text-main); margin-bottom: 0.4rem;">🎯 Le Défi / Contexte Initial</h4>
          <p style="font-size: 0.95rem; color: var(--text-muted); line-height: 1.6;">${data.challenge}</p>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <h4 style="font-size: 1.1rem; color: var(--text-main); margin-bottom: 0.4rem;">⚙️ Actions Menées & Méthodologie</h4>
          <p style="font-size: 0.95rem; color: var(--text-muted); line-height: 1.6;">${data.solution}</p>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <h4 style="font-size: 1.1rem; color: var(--text-main); margin-bottom: 0.5rem;">📦 Livrables & Résultats</h4>
          <ul style="list-style: none; padding-left: 0; display: flex; flex-direction: column; gap: 0.4rem;">
            ${data.deliverables.map(d => `
              <li style="font-size: 0.9rem; color: var(--text-main); display: flex; gap: 0.5rem; align-items: center;">
                <span style="color: var(--accent-primary); font-weight: bold;">✔</span> ${d}
              </li>
            `).join('')}
          </ul>
        </div>

        <div>
          <h4 style="font-size: 0.9rem; color: var(--text-subtle); text-transform: uppercase; margin-bottom: 0.5rem;">Outils Utilisés</h4>
          <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
            ${data.tools.map(t => `<span class="soft-pill" style="border-color: var(--accent-primary); color: var(--accent-primary);">${t}</span>`).join('')}
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
  });
}

/* ==========================================================================
   7. ANIMATED NUMBER COUNTERS (INTERSECTION OBSERVER)
   ========================================================================== */
function initCounters() {
  const counters = document.querySelectorAll('.counter');
  let hasAnimated = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasAnimated) {
        hasAnimated = true;
        counters.forEach(counter => {
          const target = +counter.getAttribute('data-target');
          let count = 0;
          const duration = 1500;
          const stepTime = 30;
          const step = Math.max(1, Math.ceil(target / (duration / stepTime)));

          const timer = setInterval(() => {
            count += step;
            if (count >= target) {
              counter.textContent = target;
              clearInterval(timer);
            } else {
              counter.textContent = count;
            }
          }, stepTime);
        });
      }
    });
  }, { threshold: 0.3 });

  const metricsSection = document.querySelector('.hero-metrics');
  if (metricsSection) observer.observe(metricsSection);
}

/* ==========================================================================
   8. 3D CARD TILT ON MOUSEMOVE
   ========================================================================== */
function initCard3DTilt() {
  const tiltCard = document.getElementById('profileCard');
  if (!tiltCard) return;

  tiltCard.addEventListener('mousemove', (e) => {
    const rect = tiltCard.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    tiltCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  });

  tiltCard.addEventListener('mouseleave', () => {
    tiltCard.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  });
}

/* ==========================================================================
   9. CONTACT FORM VALIDATION & CLIPBOARD COPY
   ========================================================================== */
function initContactForm() {
  const contactForm = document.getElementById('contactForm');
  const copyEmailBtn = document.getElementById('copyEmailBtn');

  // Copy email
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', () => {
      const email = document.getElementById('emailContactLink').textContent.trim();
      navigator.clipboard.writeText(email).then(() => {
        showToast('📋 Adresse email copiée dans le presse-papier !');
      }).catch(() => {
        showToast(`Email : ${email}`);
      });
    });
  }

  // Submit form
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      let isValid = true;
      const nameInput = document.getElementById('contactName');
      const emailInput = document.getElementById('contactEmail');
      const subjectInput = document.getElementById('contactSubject');
      const messageInput = document.getElementById('contactMessage');

      // Clear errors
      contactForm.querySelectorAll('.form-group').forEach(fg => fg.classList.remove('has-error'));

      if (!nameInput.value.trim()) {
        nameInput.closest('.form-group').classList.add('has-error');
        isValid = false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailInput.value.trim())) {
        emailInput.closest('.form-group').classList.add('has-error');
        isValid = false;
      }

      if (!subjectInput.value) {
        subjectInput.closest('.form-group').classList.add('has-error');
        isValid = false;
      }

      if (!messageInput.value.trim() || messageInput.value.trim().length < 10) {
        messageInput.closest('.form-group').classList.add('has-error');
        isValid = false;
      }

      if (isValid) {
        const submitBtn = document.getElementById('submitFormBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Envoi en cours...</span>`;

        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>Message Envoyé avec succès !</span>
          `;
          showToast(`📩 Merci ${nameInput.value.trim()} ! Votre message a bien été transmis.`);
          contactForm.reset();

          setTimeout(() => {
            submitBtn.innerHTML = `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              <span>Envoyer ma proposition</span>
            `;
          }, 3500);
        }, 800);
      }
    });
  }
}

/* ==========================================================================
   10. MOBILE DRAWER NAVIGATION
   ========================================================================== */
function initMobileDrawer() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const drawerCloseBtn = document.getElementById('drawerCloseBtn');
  const drawerLinks = document.querySelectorAll('.drawer-link');

  if (!mobileDrawer) return;

  function toggleDrawer(open) {
    mobileDrawer.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => toggleDrawer(true));
  }
  if (drawerCloseBtn) {
    drawerCloseBtn.addEventListener('click', () => toggleDrawer(false));
  }
  drawerLinks.forEach(link => {
    link.addEventListener('click', () => toggleDrawer(false));
  });
}

/* ==========================================================================
   11. TOAST NOTIFICATION UTILITY
   ========================================================================== */
function showToast(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span style="color: var(--accent-primary);">✦</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
