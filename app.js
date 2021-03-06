const client = contentful.createClient({
  // This is the space ID. A space is like a project folder in Contentful terms
  space: "qxjrcyzyfx42",
  // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
  accessToken: "Ctcg-6Pz2Q6i4Favw7bUKx48F63ScYQh_6VQJ53UQWM",
});

const cartBtn = document.querySelector(".cart-btn");
const closeCartBtn = document.querySelector(".close-cart");
const clearCartBtn = document.querySelector(".clear-cart");
const cartDOM = document.querySelector(".cart");
const cartOverlay = document.querySelector(".cart-overlay");
const cartItems = document.querySelector(".cart-items");
const cartTotal = document.querySelector(".cart-total");
const cartContent = document.querySelector(".cart-content");
const productsDOM = document.querySelector(".product-center");

let cart = [];

//buttons
let buttonsDOM = [];

// getting the products
class Products {
  async getProducts() {
    try {
      let contentful = await client.getEntries({
        content_type: "cassieWardrobeItems",
      });
      console.log(contentful);

      // let result = await fetch("products.json");
      // let data = await result.json(); for when using products.json file

      let products = contentful.items; // when using contentful
      console.log(products);
      // let products = data.items; when using products.json
      products = products.map((item) => {
        const { title, price } = item.fields;
        const { id } = item.sys;
        const description = item.fields.description;
        const image = item.fields.picture.fields.file.url;
        return { title, price, id, image, description };
      });
      return products;
    } catch (error) {
      console.log(error);
    }
  }
}

//display products
class UI {
  displayProducts(products) {
    let result = "";
    products.forEach(
      (product) =>
        (result += `
      <article class="product">
          <div class="img-container">
            <img
              src=${product.image}
              alt="product"
              class="product-img"
            />
            <button class="bag-btn" data-id=${product.id}>
              <i class="fa fa-shopping-cart"> Add to bag</i>
            </button>
          </div>
          <h3>${product.title}</h3>
          <h3>${product.description}</h3>
          <h4>NGN ${product.price}</h4>          
        </article>
    `)
    );
    productsDOM.innerHTML = result;
  }
  getBagButtons() {
    const buttons = [...document.querySelectorAll(".bag-btn")]; //the spread operator converts the buttons from a nodelist to an array
    buttonsDOM = buttons;
    buttons.forEach((button) => {
      let id = button.dataset.id;
      // to create a local storage to check if product is in cart or not
      let inCart = cart.find((item) => item.id === id);
      if (inCart) {
        button.innerHTML = "In Cart";
        button.disabled = true;
      }
      button.addEventListener("click", (event) => {
        event.target.innerText = "In Cart";
        event.target.disabled = true;
        //get product from products local storage
        let cartItem = { ...Storage.getProduct(id), amount: 1 }; //this id is from the item id in inCart, then spread the object and add an amount property.

        //add product to cart
        cart = [...cart, cartItem];
        //save cart in local Storage
        Storage.saveCart(cart);
        //set cart values
        this.setCartValues(cart);
        //display cart item
        this.addCartItem(cartItem);
        //show the cart
        this.showCart();
      });
    });
  }
  setCartValues(cart) {
    let tempTotal = 0;
    let itemsTotal = 0;
    cart.map((item) => {
      tempTotal += item.price * item.amount;
      itemsTotal += item.amount;
    });
    cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
    cartItems.innerText = itemsTotal;
  }
  addCartItem(item) {
    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = `
               <img src=${item.image} alt="product" />
            <div>
              <h4>${item.title}</h4>
              <h5>$${item.price}</h5>
              <span class="remove-item" data-id =${item.id}>remove</span>
            </div>
            <div>
              <i class="fa fa-plus-square-o" aria-hidden="true" data-id =${item.id}></i>
              <p class="item-amount">${item.amount}</p>
              <i class="fa fa-minus-square-o" aria-hidden="true" data-id =${item.id}></i>
            </div>`;
    cartContent.appendChild(div);
  }
  showCart() {
    cartOverlay.classList.add("transparentBcg");
    cartDOM.classList.add("showCart");
  }
  setupAPP() {
    //upon loading the application, set cart values whether cart is empty or not
    cart = Storage.getCart();
    this.setCartValues(cart);
    this.populateCart(cart);
    cartBtn.addEventListener("click", this.showCart);
    closeCartBtn.addEventListener("click", this.hideCart);
  }
  populateCart(cart) {
    cart.forEach((item) => this.addCartItem(item));
  }
  hideCart() {
    cartOverlay.classList.remove("transparentBcg");
    cartDOM.classList.remove("showCart");
  }
  cartLogic() {
    clearCartBtn.addEventListener("click", () => {
      this.clearCart();
    });
    //cart functionality
    cartContent.addEventListener("click", (event) => {
      if (event.target.classList.contains("remove-item")) {
        let removeItem = event.target;
        let id = removeItem.dataset.id;
        cartContent.removeChild(removeItem.parentElement.parentElement);
        this.removeItem(id);
      } else if (event.target.classList.contains("fa-plus-square-o")) {
        let addAmount = event.target;
        let id = addAmount.dataset.id;
        let tempItem = cart.find((item) => item.id === id);
        tempItem.amount = tempItem.amount + 1;
        Storage.saveCart(cart);
        this.setCartValues(cart);
        addAmount.nextElementSibling.innerText = tempItem.amount;
      } else if (event.target.classList.contains("fa-minus-square-o")) {
        let lowerAmount = event.target;
        let id = lowerAmount.dataset.id;
        let tempItem = cart.find((item) => item.id === id);
        tempItem.amount = tempItem.amount - 1;
        if (tempItem.amount > 0) {
          Storage.saveCart(cart);
          this.setCartValues(cart);
          lowerAmount.previousElementSibling.innerText = tempItem.amount;
        } else {
          cartContent.removeChild(lowerAmount.parentElement.parentElement);
          this.removeItem(id);
        }
      }
    });
  }
  clearCart() {
    let cartItems = cart.map((item) => item.id);
    cartItems.forEach((id) => this.removeItem(id));
    while (cartContent.children.length > 0) {
      cartContent.removeChild(cartContent.children[0]);
    }
    this.hideCart();
  }
  removeItem(id) {
    cart = cart.filter((item) => item.id !== id);
    this.setCartValues(cart);
    Storage.saveCart(cart);
    let button = this.getSingleButton(id);
    button.disabled = false;
    button.innerHTML = `<i class = "fa fa-shopping-cart"></i>Add to cart`;
  }
  getSingleButton(id) {
    return buttonsDOM.find((button) => button.dataset.id === id);
  }
}

// local storage
class Storage {
  static saveProducts(products) {
    localStorage.setItem("products", JSON.stringify(products));
  }
  static getProduct(id) {
    let products = JSON.parse(localStorage.getItem("products"));
    return products.find((product) => product.id === id); //return a product that matches the id passed into the function
  }
  static saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
  }
  static getCart() {
    return localStorage.getItem("cart")
      ? JSON.parse(localStorage.getItem("cart"))
      : []; //if local storage is empty, return an empty array
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const ui = new UI();
  const products = new Products();
  //setup app
  ui.setupAPP();
  //get all products
  products
    .getProducts()
    .then((products) => {
      ui.displayProducts(products);

      Storage.saveProducts(products);
    })
    .then(() => {
      ui.getBagButtons();
      ui.cartLogic();
    });
});
