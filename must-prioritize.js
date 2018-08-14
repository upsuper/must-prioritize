let gSelected;
async function loadSelected() {
  let data = await browser.storage.sync.get({selected: {}});
  gSelected = data.selected;
  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName == "sync" && changes.selected) {
      gSelected = changes.selected.newValue;
    }
  });
}
loadSelected();

for (let form of document.querySelectorAll(".enter_bug_form")) {
  form.addEventListener("submit", evt => {
    let product = form.querySelector("#field_container_product");
    let components = gSelected[product.textContent.trim()];
    console.log(components);
    if (!components) {
      return;
    }
    let component = form.querySelector("#component");
    console.log(component.value);
    if (!components.includes(component.value)) {
      return;
    }
    let priority = form.querySelector("#priority");
    console.log(priority.value);
    if (priority.value.startsWith("P")) {
      return;
    }
    let error = document.createElement("div");
    error.className = "validation_error_text";
    error.textContent = "You must enter a Priority for this bug";
    priority.after(error);
    priority.focus();
    evt.preventDefault();
  });
}
