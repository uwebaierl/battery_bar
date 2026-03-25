export function buildCardPreviewMarkup(description) {
  return `
    <div class="card-preview-placeholder" hidden>
      <p class="card-preview-placeholder__text">${description}</p>
    </div>
  `;
}

export function buildCardPreviewStyles(heightCssVarName) {
  return `
      .card-preview-placeholder {
        grid-column: 1 / -1;
        min-height: var(${heightCssVarName});
        display: flex;
        align-items: center;
        justify-content: center;
        justify-self: center;
        max-width: 100%;
        padding: 16px 20px;
        text-align: center;
      }

      .card-preview-placeholder[hidden] {
        display: none;
      }

      .card-preview-placeholder__text {
        margin: 0;
        color: var(--primary-text-color);
        font-size: 15px;
        line-height: 1.35;
      }
  `;
}

export function syncCardPreviewVisibility(previewPlaceholderEl, contentElements, showPlaceholder) {
  if (previewPlaceholderEl) {
    previewPlaceholderEl.hidden = showPlaceholder !== true;
  }

  for (const element of contentElements || []) {
    if (element) {
      element.hidden = showPlaceholder === true;
    }
  }
}

export function hasRequiredEntityValues(entities, requiredKeys) {
  return (requiredKeys || []).every((key) => {
    const value = entities?.[key];
    return typeof value === "string" && value.trim().length > 0;
  });
}
