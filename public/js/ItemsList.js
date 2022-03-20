export default class ItemsList {
    /* name and placeholder are set as attributes of the add input. */
    constructor() {
  
      this._callbacks = {onDelete: null };
      this._list = null;
  
      this._onDelete = this._onDelete.bind(this);
  
      this._createElements();
    }
  
    /* Add this component to the DOM tree under parent. When a new item is added, the onAdd callback is called with the
       value of the item as argument. When an item is deleted, onDelete is called with the value being deleted. */
    addToDOM(parent, onDelete) {
      this._callbacks = { onDelete };
      parent.append(this._list);
    }
  
    /* Set the list of items being displayed. items is an Array of item strings. */
    setList(items) {
        console.log(items);
      this._list.textContent = "";
      for (let item of items) {
        let node = document.createElement("li");
        let label = document.createElement("h1");
        let img = document.createElement("img");
        img.src = item.image;
        img.classList.add("myItemImage");
        label.textContent = item.text;
        label.id = item._id;
        label.classList.add("label");
        node.append(img);
        node.append(label);

  
        let button = document.createElement("button");
        button.type = "button";
        button.classList.add("deleteButton");
        /* Set this attribute to make the button readable with assistive technology. */
        button.setAttribute("aria-label", `Remove ${item}`);
        button.textContent = "Complete"; /* The "times" character */
        button.addEventListener("click", this._onDelete);
        node.append(button);
  
        this._list.append(node);
      }
    }
  
    /* Create the DOM elements for this component, storing them in instance variables. This method does not add the
       elements to the tree; that is done by addToDOM. */
    _createElements() {
      this._list = document.createElement("ul");
      this._list.classList.add("dynamicList");
    }

    _onDelete(event) {
      let li = event.currentTarget.closest("li");
      let item = li.querySelector(".label").id;
      this._callbacks.onDelete(item);
    }
  }