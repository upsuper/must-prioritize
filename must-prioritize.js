let gSelected;
let gOtherOptions;

async function loadSelected() {
  let data = await browser.storage.sync.get({selected: {}, otherOptions: {}});
  gSelected = data.selected;
  gOtherOptions = data.otherOptions;
  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName == "sync") {
      if (changes.selected) {
        gSelected = changes.selected.newValue;
      }
      if (changes.otherOptions) {
        gOtherOptions = changes.otherOptions.newValue;
      }
    }
  });
}
loadSelected();

function mustPrioritizeByProduct(form) {
  let product = form.querySelector("#field_container_product").textContent.trim();

  let components = gSelected[product];
  console.log(components);

  let component = form.querySelector("#component").value;
  console.log(component);

  return components && components.includes(component);
}

function mustPrioritizeSelfAssignedBug(form) {
  console.log(gOtherOptions);
  if (!gOtherOptions.mustPrioritizeSelfAssignedBug)
    return false;

  const assignee = form.querySelector("#assigned_to").value;
  console.log(assignee);

  if (!assignee)
    return false;

  const userEmail = document.querySelector('.email').textContent.trim();
  console.log(userEmail);
  if (userEmail == assignee)
    return true;

  const userName = document.querySelector('.name').textContent.trim();
  console.log(userName);
  return userName.includes(assignee);
}

function mustPrioritize(form) {
  if (mustPrioritizeByProduct(form))
    return true;
  return mustPrioritizeSelfAssignedBug(form);
}

for (let form of document.querySelectorAll(".enter_bug_form")) {
  form.addEventListener("submit", evt => {
    if (!mustPrioritize(form))
      return;

    let priority = form.querySelector("#priority");
    console.log(priority.value);

    if (priority.value.startsWith("P"))
      return;

    let error = document.createElement("div");
    error.className = "validation_error_text";
    error.textContent = "You must enter a Priority for this bug";
    priority.after(error);
    priority.focus();
    evt.preventDefault();
  });
}
