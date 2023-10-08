const Order = require("./Order");

const OrderState = Object.freeze({
  WELCOMING: Symbol("welcoming"),
  SIZE: Symbol("size"),
  TOPPINGS: Symbol("toppings"),
  DRINKS: Symbol("drinks"),
  DRINKSCHECK: Symbol("drinksCheck"),
  COOKIES: Symbol("cookies"),
  SUMMARY: Symbol("summary"),
  PAYMENT: Symbol("payment"),
});
const price = {
  shawarma: 12,
  fish: 13,
  burger: 10,
  drinks: 2,
  cookies: 1,
};

module.exports = class ShwarmaOrder extends Order {
  constructor(sNumber, sUrl) {
    super(sNumber, sUrl);
    this.stateCur = OrderState.WELCOMING;
    this.sItem = "";
    this.sSize = "";
    this.sToppings = "";
    this.sDrinks = "";
    this.sCookies = "";
    this.estimatedPrice = 0;
    this.itemsDescription = [];
  }

  handleInput(sInput) {
    let aReturn = [];
    switch (this.stateCur) {
      case OrderState.WELCOMING:
        this.stateCur = OrderState.ITEM_SELECTION;
        aReturn.push("Welcome to Surendra's Kitchen!");
        aReturn.push(
          "What would you like to order? (Shawarma, Fish, or Burger)"
        );
        break;

      case OrderState.ITEM_SELECTION:
        sInput = sInput.toLowerCase();
        if (
          sInput === "shawarma" ||
          sInput === "burger" ||
          sInput === "fish"
        ) {
          this.stateCur = OrderState.SIZE;
          this.sItem = sInput;
          aReturn.push(
            `What size ${this.sItem} would you like? (Small, Medium, Large)`
          );
        } else {
          aReturn.push(
            "Sorry, Please select from the below."
          );
          aReturn.push("Shawarma, Fish, or Burger.");
          this.stateCur = OrderState.ITEM_SELECTION;
        }
        break;

      case OrderState.SIZE:
        sInput = sInput.toLowerCase();
        if (sInput === "small" || sInput === "medium" || sInput === "large") {
          this.stateCur = OrderState.TOPPINGS;
          this.sSize = sInput;
          aReturn.push(
            `What toppings would you like on your ${this.sSize} ${this.sItem}?`
          );
        } else {
          aReturn.push("Sorry, we dont get it, please provide proper size.");
          aReturn.push("small, medium, large.");
          this.stateCur = OrderState.SIZE;
        }
        break;

      case OrderState.TOPPINGS:
        this.stateCur = OrderState.DRINKSCHECK;
        this.sToppings = sInput;
        aReturn.push("Would you like drinks with that? (Yes or No)");
        break;

      case OrderState.DRINKSCHECK:
        if (sInput.toLowerCase() == "yes") {
          this.stateCur = OrderState.DRINKS;
          aReturn.push("Which drink do you like? (Cola, Ginger Ale, Pepsi)");
        } else if (sInput.toLowerCase() == "no") {
          this.stateCur = OrderState.COOKIES;
          aReturn.push("Would you like cookies with that? (Yes or No)");
        } else {
          aReturn.push("Please enter Yes or No for the drinks");
          this.stateCur = OrderState.DRINKSCHECK;
        }
        break;

      case OrderState.DRINKS:
        sInput = sInput.toLowerCase();
        if (sInput === "cola" || sInput === "ginger ale" || sInput === "pepsi") {
          this.stateCur = OrderState.COOKIES;
          this.sDrinks = sInput;
          aReturn.push("Would you like cookies with that? (Yes or No)");
        } else {
          aReturn.push("Please enter from the given options.");
          aReturn.push("Cola, Ginger Ale, Pepsi");
          this.stateCur = OrderState.DRINKS;
        }
        break;

      case OrderState.COOKIES:
        if (sInput.toLowerCase() == "yes") {
          this.stateCur = OrderState.SUMMARY;
          this.sCookies = "cookies";
          aReturn.push(
            "Do you like to order anything else from the menu? (Yes or No)"
          );
        } else if (sInput.toLowerCase() == "no") {
          this.stateCur = OrderState.SUMMARY;
          aReturn.push(
            "Do you like to order anything else from the menu? (Yes or No)"
          );
        } else {
          aReturn.push("Please enter Yes or No for the cookies");
          this.stateCur = OrderState.COOKIES;
        }
        break;

      case OrderState.SUMMARY:
        if (sInput.toLowerCase() == "yes") {
          this.generateOrderSummary();
          aReturn.push(
            "What would you like to order? (Shawarma, Fish, or Burger)"
          );
          this.stateCur = OrderState.ITEM_SELECTION;
        } else if (sInput.toLowerCase() == "no") {
          this.generateOrderSummary();
          aReturn.push(`Your order:\n`);
          this.itemsDescription.forEach((cur, i) => {
            aReturn.push(`${i + 1}. ${cur}`);
          });
          aReturn.push(`
              Total cost of the order
              Price          : ${this.estimatedPrice.toFixed(2)} 
              Tax(13%)       : ${(this.estimatedPrice * 0.13).toFixed(2)}
              __________________________
              Total Price    : ${(
                this.estimatedPrice * 0.12 +
                this.estimatedPrice
              ).toFixed(2)} $`);
          aReturn.push(`Please pay for your order here`);
          aReturn.push(`${this.sUrl}/payment/${this.sNumber}/`);
          this.nOrder = (
            this.estimatedPrice +
            0.13 * this.estimatedPrice
          ).toFixed(2);
          this.stateCur = OrderState.PAYMENT;
        } else {
          aReturn.push("Please enter Yes or No.");
          this.stateCur = OrderState.SUMMARY;
        }
        break;

      case OrderState.PAYMENT:
        aReturn.push("Successfully placed your order.");
        aReturn.push(
          `Your order will be delivered by ${this.getCurrentTime(
            this.itemsDescription.length * 10
          )} (in ${this.itemsDescription.length * 10} min)`
        );

        this.resetFields(true);
        this.isDone(true);
        aReturn.push(
          `Your order will be delivered at \n${this.formatAddress(
            sInput.purchase_units[0].shipping
          )}`
        );
        break;
    }
    return aReturn;
  }

  generateOrderSummary() {
    var drinkStr = this.sDrinks !== "" ? `and a ${this.sDrinks}` : "";
    var cookiesStr = this.sCookies !== "" ? `and  ${this.sCookies}` : "";
    var curitemDescription = `${this.sSize} ${this.sItem} with ${this.sToppings} ${drinkStr} ${cookiesStr}`;

    this.itemsDescription.push(curitemDescription);
    if (this.sDrinks !== "") {
      this.estimatedPrice += price.drinks;
    }
    if (this.sCookies !== "") {
      this.estimatedPrice += price.cookies;
    }
    this.estimatedPrice += price[this.sItem];

    // reseting the fields for future orders.
    this.sItem = "";
    this.sSize = "";
    this.sToppings = "";
    this.sDrinks = "";
    this.sCookies = "";
  }

  formatAddress(addressObj) {
    const {
      address: {
        address_line_1,
        address_line_2,
        admin_area_2,
        admin_area_1,
        postal_code,
        country_code,
      },
    } = addressObj;

    // Create an array to hold address lines
    const addressLines = [];

    // Add address lines 1 and 2
    if (address_line_1) {
      addressLines.push(address_line_1);
    }
    if (address_line_2) {
      addressLines.push(address_line_2);
    }

    // Add city, state/province, postal code, and country
    const cityStatePostal = `${admin_area_2}, ${admin_area_1} ${postal_code}`;
    addressLines.push(cityStatePostal);

    if (country_code) {
      addressLines.push(country_code);
    }

    // Join the address lines into a single string
    const formattedAddress = addressLines.join("\n");

    return formattedAddress;
  }

  getCurrentTime(waitingTime) {
    const currentTime = new Date();
    const completionTime = new Date(
      currentTime.getTime() + waitingTime * 60000
    );

    // Format the time as "hh:mm AM/PM"
    const options = { hour: "2-digit", minute: "2-digit", hour12: true };
    const formattedCompletionTime = completionTime.toLocaleTimeString(
      undefined,
      options
    );

    return formattedCompletionTime;
  }

  resetFields(value) {
    if (value === true) {
      this.stateCur = OrderState.WELCOMING;
      this.sNumber = "";
      this.nOrder = "";
      this.sItem = "";
      this.sSize = "";
      this.sToppings = "";
      this.sDrinks = "";
      this.estimatedPrice = 0;
      this.itemsDescription = [];
    }
  }
  renderForm(sTitle = "-1", sAmount = "-1") {
    // your client id should be kept private
    if (sTitle != "-1") {
      this.sItem = sTitle;
    }
    if (sAmount != "-1") {
      this.nOrder = sAmount;
    }
    const sClientID =
      process.env.SB_CLIENT_ID ||
      "ASKJDGUCc8eAr2lIygk1ha_TpjcE28wpl17p4iheRHeKRcCphGfwdsSin0yPz9bLS9AFB5bFOwTdKMK4";
    return `
      <!DOCTYPE html>
  
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1"> <!-- Ensures optimal rendering on mobile devices. -->
        <meta http-equiv="X-UA-Compatible" content="IE=edge" /> <!-- Optimal Internet Explorer compatibility -->
      </head>
      
      <body>
        <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
        <script
          src="https://www.paypal.com/sdk/js?client-id=${sClientID}"> // Required. Replace SB_CLIENT_ID with your sandbox client ID.
        </script>
        Thank you ${this.sNumber} for your ${this.sItem} order of $${this.nOrder}.
        <div id="paypal-button-container"></div>
  
        <script>
          paypal.Buttons({
              createOrder: function(data, actions) {
                // This function sets up the details of the transaction, including the amount and line item details.
                return actions.order.create({
                  purchase_units: [{
                    amount: {
                      value: '${this.nOrder}'
                    }
                  }]
                });
              },
              onApprove: function(data, actions) {
                // This function captures the funds from the transaction.
                return actions.order.capture().then(function(details) {
                  // This function shows a transaction success message to your buyer.
                  $.post(".", details, ()=>{
                    window.open("", "_self");
                    window.close(); 
                  });
                });
              }
          
            }).render('#paypal-button-container');
          // This function displays Smart Payment Buttons on your web page.
        </script>
      
      </body>
          
      `;
  }
};
