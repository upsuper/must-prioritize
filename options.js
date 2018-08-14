const $ = s => document.querySelector(s);
function $c(tag, props) {
  let elem = document.createElement(tag);
  for (let prop in props) {
    elem[prop] = props[prop];
  }
  return elem;
}

let gData = new Map;
let gSelected;
let gLastProduct;
let $product = $("#product");
let $component = $("#component");
let $selected = $("#selected");

async function loadProductInfo() {
  let params = new URLSearchParams;
  params.append("type", "enterable");
  params.append("include_fields", "name,components.name");
  let url = `https://bugzilla.mozilla.org/rest/product?${params}`;
  let resp = await fetch(url);
  let data = await resp.json();
  let result = data.products.map(({name, components}) => {
    return {
      name,
      components: components.map(({name}) => name),
    };
  });
  result.sort((a, b) => {
    if (a.name < b.name) { return -1; }
    if (a.name > b.name) { return 1; }
    return 0;
  });
  return result;
}

function updateComponents(preserveState) {
  let product = $product.value;
  let selectedComponents = gSelected[product];
  if (!selectedComponents) {
    selectedComponents = [];
  }
  let scrollTop, currentSelected = new Set;
  if (preserveState) {
    scrollTop = $component.scrollTop;
    for (let $s of $component.selectedOptions) {
      currentSelected.add($s.value);
    }
  }
  $component.innerHTML = "";
  for (let component of gData.get(product)) {
    if (selectedComponents.includes(component)) {
      continue;
    }
    let shouldSelect = currentSelected.has(component);
    $component.appendChild($c("option", {
      value: component,
      textContent: component,
      selected: shouldSelect,
    }));
  }
  if (preserveState) {
    $component.scrollTop = scrollTop;
  }
}

async function loadProducts() {
  for (let {name, components} of await loadProductInfo()) {
    gData.set(name, components);
    let shouldSelect = name == gLastProduct;
    $product.appendChild($c("option", {
      value: name,
      textContent: name,
      selected: shouldSelect,
    }));
  }
  $product.addEventListener("change", () => {
    gLastProduct = $product.value;
    browser.storage.sync.set({lastProduct: gLastProduct});
    updateComponents(false);
  });
  updateComponents(false);
}

function updateSelectedList() {
  $selected.innerHTML = "";
  let products = Object.getOwnPropertyNames(gSelected);
  products.sort();
  for (let product of products) {
    let group = $c("optgroup", {
      label: product,
    });
    for (let component of gSelected[product]) {
      group.appendChild($c("option", {
        value: component,
        textContent: component,
      }));
    }
    $selected.appendChild(group);
  }
}

async function loadSelected() {
  let saved = await browser.storage.sync.get({
    selected: {},
    lastProduct: "Core",
  });
  gSelected = saved.selected;
  gLastProduct = saved.lastProduct;
  updateSelectedList();
  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName == "sync" && changes.selected) {
      gSelected = changes.selected.newValue;
      updateSelectedList();
      updateComponents(true);
    }
  });
}

function saveSelected() {
  let products = Object.getOwnPropertyNames(gSelected);
  for (let product of products) {
    if (gSelected[product].length == 0) {
      delete gSelected[product];
    } else {
      let set = new Set(gSelected[product]);
      gSelected[product] = Array.from(set.keys()).sort();
    }
  }
  browser.storage.sync.set({selected: gSelected});
  updateSelectedList();
  updateComponents(true);
}

$("#add").addEventListener("click", () => {
  let components = Array.from($component.selectedOptions);
  if (components.length == 0) {
    return;
  }
  let product = $product.value;
  if (!gSelected[product]) {
    gSelected[product] = [];
  }
  for (let $c of components) {
    gSelected[product].push($c.value);
    $c.remove();
  }
  saveSelected();
});

$("#remove").addEventListener("click", () => {
  let components = Array.from($selected.selectedOptions);
  if (components.length == 0) {
    return;
  }
  for (let $c of components) {
    let product = $c.parentNode.label;
    let pos = gSelected[product].indexOf($c.value);
    if (pos < 0) {
      console.error(`Failed to find ${$c.value} in selected`);
      continue;
    }
    gSelected[product].splice(pos, 1);
  }
  saveSelected();
});

async function load() {
  await loadSelected();
  await loadProducts();
}
load();
