// 今日の猫アルバム。その日の猫を全員並べる（会えなかった猫も見られる）。

/** @typedef {import('../types.js').Cat} Cat */

/**
 * @param {HTMLElement} gridEl
 * @param {Cat[]} cats
 * @param {Set<string>} matchedCatIds  今回のプレイでそろえた猫
 * @param {(cat: Cat) => void} onSelect
 */
export function renderAlbum(gridEl, cats, matchedCatIds, onSelect) {
  // そろえた猫を先に、残りを後ろに
  const ordered = [
    ...cats.filter((c) => matchedCatIds.has(c.id)),
    ...cats.filter((c) => !matchedCatIds.has(c.id)),
  ];

  gridEl.replaceChildren(
    ...ordered.map((cat) => {
      const met = matchedCatIds.has(cat.id);
      const li = document.createElement('li');
      li.className = `album__item${met ? '' : ' album__item--missed'}`;

      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', `${met ? '会えた猫' : '会えなかった猫'}。大きく見る`);
      button.addEventListener('click', () => onSelect(cat));

      const img = document.createElement('img');
      img.className = 'album__photo';
      img.src = cat.imageUrl;
      img.alt = '';
      img.loading = 'lazy';

      const label = document.createElement('span');
      label.className = 'album__label';
      const breed = document.createElement('span');
      breed.textContent = cat.breed ?? '';
      const badge = document.createElement('span');
      badge.className = 'album__badge';
      badge.textContent = met ? '会えた' : 'また今度';
      label.append(breed, badge);

      button.append(img, label);
      li.append(button);
      return li;
    }),
  );
}
