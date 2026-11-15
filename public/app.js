// Front-end logic: one button per API route, results shown in #status and #output.

const JSON_INDENT = 2;

const statusEl = document.querySelector('#status');
const outputEl = document.querySelector('#output');
const buttons = document.querySelectorAll('button[data-url]');

// Pretty-print the body if it is JSON; otherwise show the raw text unchanged.
const formatBody = (text) => {
  try {
    return JSON.stringify(JSON.parse(text), null, JSON_INDENT);
  } catch {
    return text;
  }
};

const showResult = ({ label, body, isError }) => {
  statusEl.textContent = label;
  statusEl.classList.toggle('is-error', isError);
  outputEl.textContent = body;
};

const callApi = async (method, url) => {
  showResult({ label: `${method} ${url} …`, body: '', isError: false });

  try {
    // Relative URL: the request goes to the same server that served this page.
    const response = await fetch(url, { method });
    const text = await response.text();

    showResult({
      label: `${method} ${url} → ${response.status} ${response.statusText}`,
      body: formatBody(text),
      isError: !response.ok,
    });
  } catch (error) {
    // fetch only rejects on network failures (server down, wrong origin, …).
    showResult({
      label: `${method} ${url} → request failed`,
      body: `Could not reach the server: ${error.message}`,
      isError: true,
    });
  }
};

buttons.forEach((button) => {
  button.addEventListener('click', () => {
    callApi(button.dataset.method, button.dataset.url);
  });
});
