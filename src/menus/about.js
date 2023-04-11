import { open } from '../index.js';

export default async ({ name, icon = '', version = '', description = '', links = [], gluonVersions } = {}) => {
  const html = `
<title>${name}</title>
<link rel="icon" href="${icon}">
<div class="hero">
  <img width=128 src="${icon}">
  <div class="name">
    <span>${name}</span>
    <span class="version">${version}</span>
  </div>
</div>
<span class="desc">${description}</span>
${gluonVersions ? `<div class="gluon-versions">
  <span>Powered by</span>
  <div>
    <div>
      <img width=28 height=28 src="https://gluonjs.org/logo.png">
      ${process.versions.gluon.split('-')[0]}
    </div>
    <div>
      <img width=28 height=28 src="https://nodejs.org/static/images/favicons/favicon.png">
      ${process.versions.node}
    </div>
    <div>
      <img width=28 height=28 src="https://gluon-framework.github.io/browser-icons/${gluonVersions.product.name.toLowerCase().replaceAll(' ', '_')}.png">
      ${gluonVersions.product.version.split('.')[0]}
    </div>
  </div>
</div>` : ''}
<div class="links">${links.map(x => `<a href="${x.href}">${x.text}</a>`).join('')}</div>
<style>
  html, body {
    background: #101418;
    color: #f0f4f8;
    margin: 0;
    font-family: sans-serif;
    overflow: hidden;
  }

  body {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 1rem;
  }

  .hero {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4rem;
  }

  .name {
    font-weight: 900;
    font-size: 2.4em;
    display: flex;
    flex-direction: column;
  }

  .version {
    font-weight: 600;
    font-size: 0.5em;
    color: #a0a4a8;
  }

  .desc {
    margin-top: 2rem;
    font-weight: 500;
    font-size: 1.2em;
  }

  .gluon-versions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    width: 100%;
    margin-top: 2rem;
  }

  .gluon-versions > span {
    font-weight: 600;
    font-size: 1.2em;
  }

  .gluon-versions > div {
    display: flex;
    gap: 0.4rem 1rem;
  }

  .gluon-versions > div > div {
    display: flex;
    align-items: center;
    gap: 0.4rem;

    font-weight: 600;
    font-size: 1em;
    color: #a0a4a8;
  }

  .links {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 80%;
    margin-top: 2rem;
    gap: 1rem;
  }

  a {
    color: #c2a2df;
    text-decoration: none;
    width: fit-content;
  }

  a:hover {
    text-decoration: underline;
  }
</style>`;

  const url = 'data:text/html;base64,' + Buffer.from(html).toString('base64');
  open(url, {
    windowSize: [ 420 + (name.length * 8), 340 + (36 * links.length) ],
    incognito: true
  });
};