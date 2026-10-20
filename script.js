"use strict";

function showSection(sectionName) {
  document.querySelectorAll(".content").forEach(section => {
    section.classList.toggle("active", section.id === sectionName);
  });
  history.replaceState(null, "", `#${sectionName}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function getJSON(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path} (${response.status})`);
  return response.json();
}

function externalLink(url, label, className = "") {
  if (!url) return label;
  return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="${className}">${label}</a>`;
}

async function loadCertifications() {
  const certifications = await getJSON("data/certifications.json");
  const container = document.getElementById("certifications-list");
  container.innerHTML = certifications.map(cert => `
    <article class="certification-item">
      <h3>${externalLink(cert.link, cert.title, "education-link")}</h3>
      <p class="issuer">${[cert.issuer, cert.code, cert.year].filter(Boolean).join(" • ")}</p>
      ${cert.verificationLink ? `<p class="issuer">${externalLink(cert.verificationLink, "Verify Credential", "education-link")}</p>` : ""}
    </article>`).join("");
}

function projectDetails(project) {
  return `
    <div class="project-details">
      ${project.role ? `<p><strong>Role:</strong> ${project.role}</p>` : ""}
      ${project.keywords?.length ? `<p><strong>Keywords:</strong> ${project.keywords.join(", ")}</p>` : ""}
      ${project.summary ? `<p><strong>Summary:</strong> ${project.summary}</p>` : ""}
      ${project.contributions?.length ? `<p><strong>Key Contributions:</strong></p><ul>${project.contributions.map(c => `<li>${c}</li>`).join("")}</ul>` : ""}
      ${project.outcome ? `<p><strong>Outcome:</strong> ${project.outcome}</p>` : ""}
    </div>`;
}

function enableToggles(scope = document) {
  scope.querySelectorAll(".project-toggle").forEach(button => {
    if (button.dataset.bound) return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      const details = button.nextElementSibling;
      const expanded = details.classList.toggle("active");
      details.classList.toggle("show", expanded);
      button.textContent = expanded ? "Hide Details" : "View Details";
      button.setAttribute("aria-expanded", String(expanded));
    });
  });
}

async function loadIndustryProjects() {
  const projects = await getJSON("data/projects.json");
  const container = document.getElementById("industry-projects-list");
  container.innerHTML = projects.map(project => `
    <article class="industry-project">
      <h3>${project.title}</h3>
      ${(project.organization || project.duration) ? `<p class="project-meta">${[project.organization, project.duration].filter(Boolean).join(" • ")}</p>` : ""}
      <button class="project-toggle" type="button" aria-expanded="false">View Details</button>
      ${projectDetails(project)}
    </article>`).join("");
  enableToggles(container);
}

async function loadCareer() {
  const projects = await getJSON("data/career-projects.json");
  const timeline = document.getElementById("career-timeline");
  timeline.classList.add("timeline");
  timeline.innerHTML = projects.map(project => `
    <article class="timeline-item">
      <div class="timeline-date">${project.period || ""}</div>
      <div class="timeline-content">
        <h3>${project.role || ""}</h3>
        <h4>${externalLink(project.institution_link, project.institution || "")}${project.lab ? `<br>${externalLink(project.lab_link, project.lab)}` : ""}</h4>
        <h5 class="career-project-title"><strong>${project.label || "Project"}:</strong> ${project.title || ""}</h5>
        <button class="project-toggle" type="button" aria-expanded="false">View Details</button>
        <div class="project-details">
          ${(project.description || []).map(d => `<p>${d}</p>`).join("")}
          ${project.technologies?.length ? `<p class="keywords">${project.technologies.join(" • ")}</p>` : ""}
        </div>
      </div>
    </article>`).join("");
  enableToggles(timeline);
}

async function loadPublications() {
  const publications = await getJSON("data/publications.json");
  const journal = document.getElementById("journal-list");
  const conference = document.getElementById("conference-list");
  const book = document.getElementById("book-list");
  const visible = publications.filter(paper => paper.visible !== false);

  const groups = { journal: [], conference: [], book: [] };
  visible.forEach((paper, index) => {
    const authors = (paper.authors || "").replace(/Yaser Mansouri/g, "<strong>Yaser Mansouri</strong>");
    const details = (paper.details || "").replace(/\[(.*?)\]/g, "<strong>[$1]</strong>");
    const title = paper.link
      ? `<a href="${paper.link}" target="_blank" rel="noopener noreferrer">“${paper.title}”</a>`
      : `“${paper.title}”`;
    const item = `<article class="publication"><p>${index + 1}. ${authors}, <strong class="paper-title">${title}</strong>, <em>${paper.venue || ""}</em>, ${paper.year || ""}${details ? `, ${details}` : ""}</p></article>`;
    if (groups[paper.type]) groups[paper.type].push(item);
  });
  journal.innerHTML = groups.journal.join("");
  conference.innerHTML = groups.conference.join("");
  book.innerHTML = groups.book.join("");
}

async function initializeSite() {
  const requested = location.hash.slice(1);
  if (requested && document.getElementById(requested)) showSection(requested);
  else showSection("about");

  const loaders = [loadCertifications(), loadIndustryProjects(), loadCareer(), loadPublications()];
  const results = await Promise.allSettled(loaders);
  results.filter(r => r.status === "rejected").forEach(r => console.error(r.reason));
}

document.addEventListener("DOMContentLoaded", initializeSite);
