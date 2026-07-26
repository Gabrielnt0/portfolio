"use strict";

/* ========================================
   ELEMENTOS
======================================== */

const menuButton = document.querySelector(".menu-button");
const navigation = document.querySelector(".navigation");
const navigationLinks = document.querySelectorAll(".navigation-link");
const currentYear = document.querySelector("#current-year");
const preloader = document.querySelector(".preloader");

const pageSections = document.querySelectorAll(
    "main section[id]"
);

const hero = document.querySelector(".hero");
const heroImage = document.querySelector(".hero-image");
const heroGlow = document.querySelector(".hero-glow");

const scrollTopButton = document.querySelector(".scroll-top-button");

const interactiveCards = document.querySelectorAll(
    [
        ".about-card",
        ".timeline-item",
        ".skill-card",
        ".project-card",
        ".education-card",
        ".contact-card"
    ].join(",")
);

/* ========================================
   PREFERÊNCIAS DO DISPOSITIVO
======================================== */

const reducedMotionPreference = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
);

const precisePointer = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
);

/* ========================================
   PRELOADER
======================================== */

function hidePreloader() {
    if (!preloader) {
        return;
    }

    preloader.classList.add("is-hidden");

    window.setTimeout(() => {
        preloader.remove();
    }, 550);
}

window.addEventListener(
    "load",
    () => {
        window.setTimeout(
            hidePreloader,
            reducedMotionPreference.matches
                ? 0
                : 450
        );
    }
);

/* ========================================
   MENU MOBILE
======================================== */

function closeMenu() {
    if (!menuButton || !navigation) {
        return;
    }

    navigation.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-is-open");
}

function toggleMenu() {
    if (!menuButton || !navigation) {
        return;
    }

    const menuIsOpen = navigation.classList.toggle("is-open");

    menuButton.setAttribute(
        "aria-expanded",
        String(menuIsOpen)
    );

    document.body.classList.toggle(
        "menu-is-open",
        menuIsOpen
    );
}

if (menuButton && navigation) {
    menuButton.addEventListener("click", toggleMenu);

    navigationLinks.forEach((link) => {
        link.addEventListener("click", closeMenu);
    });

    document.addEventListener("click", (event) => {
        const clickedInsideNavigation =
            navigation.contains(event.target);

        const clickedMenuButton =
            menuButton.contains(event.target);

        if (!clickedInsideNavigation && !clickedMenuButton) {
            closeMenu();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMenu();
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 960) {
            closeMenu();
        }
    });
}

/* ========================================
   ANO DO RODAPÉ
======================================== */

if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
}

/* ========================================
   ANIMAÇÕES AO ROLAR
======================================== */

const animatedElements = document.querySelectorAll(
    [
        ".section-header",
        ".about-text",
        ".about-card",
        ".timeline-item",
        ".skill-card",
        ".project-card",
        ".education-card",
        ".resume-container",
        ".contact-card"
    ].join(",")
);

animatedElements.forEach((element, index) => {
    element.classList.add("reveal");

    element.style.setProperty(
        "--reveal-delay",
        `${Math.min(index % 4, 3) * 90}ms`
    );
});

if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        },
        {
            threshold: 0.12,
            rootMargin: "0px 0px -50px 0px"
        }
    );

    animatedElements.forEach((element) => {
        revealObserver.observe(element);
    });
} else {
    animatedElements.forEach((element) => {
        element.classList.add("is-visible");
    });
}

/* ========================================
   SEÇÃO ATIVA NO MENU
======================================== */

function updateActiveNavigation() {
    const scrollPosition =
        window.scrollY + window.innerHeight * 0.32;

    let activeSectionId = "inicio";

    pageSections.forEach((section) => {
        if (scrollPosition >= section.offsetTop) {
            activeSectionId = section.id;
        }
    });

    navigationLinks.forEach((link) => {
        const linkDestination = link.getAttribute("href");

        const isActive =
            linkDestination === `#${activeSectionId}`;

        link.classList.toggle("is-active", isActive);

        if (isActive) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });
}

window.addEventListener(
    "scroll",
    updateActiveNavigation,
    {
        passive: true
    }
);

window.addEventListener(
    "load",
    updateActiveNavigation
);

/* ========================================
   EFEITO 3D DA IMAGEM PRINCIPAL
======================================== */

function resetHeroEffect() {
    if (heroImage) {
        heroImage.style.setProperty(
            "--rotate-x",
            "0deg"
        );

        heroImage.style.setProperty(
            "--rotate-y",
            "0deg"
        );

        heroImage.style.setProperty(
            "--hero-scale",
            "1"
        );
    }

    if (heroGlow) {
        heroGlow.style.setProperty(
            "--glow-x",
            "0px"
        );

        heroGlow.style.setProperty(
            "--glow-y",
            "0px"
        );
    }
}

function updateHeroEffect(event) {
    if (
        !hero ||
        !heroImage ||
        !heroGlow ||
        reducedMotionPreference.matches ||
        !precisePointer.matches
    ) {
        return;
    }

    const heroRectangle = hero.getBoundingClientRect();

    const mousePositionX =
        event.clientX - heroRectangle.left;

    const mousePositionY =
        event.clientY - heroRectangle.top;

    const horizontalProgress =
        mousePositionX / heroRectangle.width;

    const verticalProgress =
        mousePositionY / heroRectangle.height;

    const rotateY =
        (horizontalProgress - 0.5) * 12;

    const rotateX =
        (verticalProgress - 0.5) * -12;

    const glowMovementX =
        (
            mousePositionX -
            heroRectangle.width / 2
        ) * 0.12;

    const glowMovementY =
        (
            mousePositionY -
            heroRectangle.height / 2
        ) * 0.12;

    heroImage.style.setProperty(
        "--rotate-x",
        `${rotateX}deg`
    );

    heroImage.style.setProperty(
        "--rotate-y",
        `${rotateY}deg`
    );

    heroImage.style.setProperty(
        "--hero-scale",
        "1.02"
    );

    heroGlow.style.setProperty(
        "--glow-x",
        `${glowMovementX}px`
    );

    heroGlow.style.setProperty(
        "--glow-y",
        `${glowMovementY}px`
    );
}

if (hero && heroImage && heroGlow) {
    hero.addEventListener(
        "mousemove",
        updateHeroEffect
    );

    hero.addEventListener(
        "mouseleave",
        resetHeroEffect
    );

    reducedMotionPreference.addEventListener(
        "change",
        resetHeroEffect
    );

    precisePointer.addEventListener(
        "change",
        resetHeroEffect
    );
}

/* ========================================
   PARALLAX SUAVE NO HERO
======================================== */

function resetHeroParallax() {
    if (heroImage) {
        heroImage.style.setProperty(
            "--parallax-y",
            "0px"
        );
    }

    if (heroGlow) {
        heroGlow.style.setProperty(
            "--parallax-y",
            "0px"
        );
    }
}

function updateHeroParallax() {
    if (
        !hero ||
        !heroImage ||
        !heroGlow
    ) {
        return;
    }

    if (reducedMotionPreference.matches) {
        resetHeroParallax();
        return;
    }

    const heroRectangle = hero.getBoundingClientRect();

    const heroIsVisible =
        heroRectangle.bottom > 0 &&
        heroRectangle.top < window.innerHeight;

    if (!heroIsVisible) {
        return;
    }

    const scrollProgress = Math.min(
        Math.max(-heroRectangle.top, 0),
        heroRectangle.height
    );

    const imageMovement =
        scrollProgress * 0.08;

    const glowMovement =
        scrollProgress * 0.14;

    heroImage.style.setProperty(
        "--parallax-y",
        `${imageMovement}px`
    );

    heroGlow.style.setProperty(
        "--parallax-y",
        `${glowMovement}px`
    );
}

window.addEventListener(
    "scroll",
    updateHeroParallax,
    {
        passive: true
    }
);

window.addEventListener(
    "load",
    updateHeroParallax
);

reducedMotionPreference.addEventListener(
    "change",
    () => {
        resetHeroEffect();
        updateHeroParallax();
    }
);

/* ========================================
   BOTÃO VOLTAR AO TOPO
======================================== */

function updateScrollTopButton() {
    if (!scrollTopButton) {
        return;
    }

    scrollTopButton.classList.toggle(
        "is-visible",
        window.scrollY > 500
    );
}

window.addEventListener(
    "scroll",
    updateScrollTopButton,
    {
        passive: true
    }
);

updateScrollTopButton();

if (scrollTopButton) {
    scrollTopButton.addEventListener(
        "click",
        () => {
            window.scrollTo({
                top: 0,
                behavior:
                    reducedMotionPreference.matches
                        ? "auto"
                        : "smooth"
            });
        }
    );
}

/* ========================================
   BRILHO INTERATIVO NOS CARDS
======================================== */

function updateCardGlow(event) {
    const card = event.currentTarget;
    const cardRectangle = card.getBoundingClientRect();

    const mouseX =
        event.clientX - cardRectangle.left;

    const mouseY =
        event.clientY - cardRectangle.top;

    card.style.setProperty(
        "--mouse-x",
        `${mouseX}px`
    );

    card.style.setProperty(
        "--mouse-y",
        `${mouseY}px`
    );
}

if (
    precisePointer.matches &&
    !reducedMotionPreference.matches
) {
    interactiveCards.forEach((card) => {
        card.addEventListener(
            "mousemove",
            updateCardGlow
        );
    });
}