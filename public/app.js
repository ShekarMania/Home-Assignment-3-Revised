/*
 * Frontend Logic for application
 *
 */

// Container for frontend application
let app = {}

// Config
app.config = {
  'sessionToken' : false
}

// AJAX Client (for RESTful API)
app.client = {}

// Interface for making API calls
app.client.request = (headers,path,method,queryStringObject,payload,callback) => {

  // Set defaults
  headers = typeof(headers) == 'object' && headers !== null ? headers : {}
  path = typeof(path) == 'string' ? path : '/'
  method = typeof(method) == 'string' && ['POST','GET','PUT','DELETE'].indexOf(method.toUpperCase()) > -1 ? method.toUpperCase() : 'GET'
  queryStringObject = typeof(queryStringObject) == 'object' && queryStringObject !== null ? queryStringObject : {}
  payload = typeof(payload) == 'object' && payload !== null ? payload : {}
  callback = typeof(callback) == 'function' ? callback : false

  // For each query string parameter sent, add it to the path
  let requestUrl = path+'?'
  let counter = 0
  for(let queryKey in queryStringObject){
     if(queryStringObject.hasOwnProperty(queryKey)){
       counter++
       // If at least one query string parameter has already been added, preprend new ones with an ampersand
       if(counter > 1){
         requestUrl+='&'
       }
       // Add the key and value
       requestUrl+=queryKey+'='+queryStringObject[queryKey]
     }
  }

  // Form the http request as a JSON type
  let xhr = new XMLHttpRequest()
  xhr.open(method, requestUrl, true)
  xhr.setRequestHeader("Content-type", "application/json")

  // For each header sent, add it to the request
  for(let headerKey in headers){
     if(headers.hasOwnProperty(headerKey)){
       xhr.setRequestHeader(headerKey, headers[headerKey])
     }
  }

  // If there is a current session token set, add that as a header
  if(app.config.sessionToken){
    xhr.setRequestHeader("token", app.config.sessionToken.id)
  }

  // When the request comes back, handle the response
  xhr.onreadystatechange = () => {
      if(xhr.readyState == XMLHttpRequest.DONE) {
        let statusCode = xhr.status
        let responseReturned = xhr.responseText

        // Callback if requested
        if(callback){
          try{
            let parsedResponse = JSON.parse(responseReturned)
            callback(statusCode,parsedResponse)
          } catch(e){
            callback(statusCode,false)
          }

        }
      }
  }

  // Send the payload as JSON
  let payloadString = JSON.stringify(payload)
  xhr.send(payloadString)

}

// Bind the logout button
app.bindLogoutButton = () => {
  document.getElementById("logoutButton").addEventListener("click", (e) => {

    // Stop it from redirecting anywhere
    e.preventDefault()

    // Log the user out
    app.logUserOut()

  })
}

// Place the order
app.placeOrder = () => {

  // Get the current email
  const email = typeof(app.config.sessionToken.email) == 'string' ? app.config.sessionToken.email : false
  // form payload
  const payload = {
    'email' : email
  }
  app.client.request(undefined,'api/order','POST',undefined,payload,(statusCode,responsePayload) => {
    if([200,201].indexOf(statusCode) != -1){
      alert("Your Order is Placed Successfully")
      app.client.request(undefined,'api/cart','DELETE',payload,undefined,(statusCode,responsePayload) => {
        if([200,201].indexOf(statusCode) > -1){
          window.location = '/dashboard/menu'
        } else {
          alert("something went wrong when deleting the cart")
        }
      })
    } else {
      alert("Something Went Wrong Please Try after some time!")
    }
  })
}

// Log the user out then redirect them
app.logUserOut = (redirectUser) => {
  // Set redirectUser to default to true
  redirectUser = typeof(redirectUser) == 'boolean' ? redirectUser : true

  // Get the current token id
  let tokenId = typeof(app.config.sessionToken.id) == 'string' ? app.config.sessionToken.id : false

  // Send the current token to the tokens endpoint to delete it
  let queryStringObject = {
    'id' : tokenId
  }
  app.client.request(undefined,'api/tokens','DELETE',queryStringObject,undefined,(statusCode,responsePayload) => {
    // Set the app.config token as false
    app.setSessionToken(false)

    // Send the user to the logged out page
    if(redirectUser){
      window.location = '/session/deleted'
    }

  })
}

// Bind the forms
app.bindForms = () => {
  if(document.querySelector("form")){

    let allForms = document.querySelectorAll("form")
    for(let i = 0 i < allForms.length i++){
        allForms[i].addEventListener("submit", (e) => {

        // Stop it from submitting
        e.preventDefault()
        let formId = this.id
        let path = this.action
        let method = this.method.toUpperCase()

        // Hide the error message (if it's currently shown due to a previous error)
        document.querySelector("#"+formId+" .formError").style.display = 'none'

        // Hide the success message (if it's currently shown due to a previous error)
        if(document.querySelector("#"+formId+" .formSuccess")){
          document.querySelector("#"+formId+" .formSuccess").style.display = 'none'
        }


        // Turn the inputs into a payload
        let payload = {}
        let elements = this.elements
        for(let i = 0 i < elements.length i++){
          if(elements[i].type !== 'submit'){
            // Determine class of element and set value accordingly
            let classOfElement = typeof(elements[i].classList.value) == 'string' && elements[i].classList.value.length > 0 ? elements[i].classList.value : ''
            let valueOfElement = elements[i].type == 'checkbox' && classOfElement.indexOf('multiselect') == -1 ? elements[i].checked : classOfElement.indexOf('intval') == -1 ? elements[i].value : parseInt(elements[i].value)
            let elementIsChecked = elements[i].checked
            // Override the method of the form if the input's name is _method
            let nameOfElement = elements[i].name
            if(nameOfElement == '_method'){
              method = valueOfElement
            } else {
              // Create an payload field named "method" if the elements name is actually httpmethod
              if(nameOfElement == 'httpmethod'){
                nameOfElement = 'method'
              }
              // Create an payload field named "id" if the elements name is actually uid
              if(nameOfElement == 'uid'){
                nameOfElement = 'id'
              }
              // If the element has the class "multiselect" add its value(s) as array elements
              if(classOfElement.indexOf('multiselect') > -1){
                if(elementIsChecked){
                  payload[nameOfElement] = typeof(payload[nameOfElement]) == 'object' && payload[nameOfElement] instanceof Array ? payload[nameOfElement] : []
                  payload[nameOfElement].push(valueOfElement)
                }
              } else {
                payload[nameOfElement] = valueOfElement
              }

            }
          }
        }


        // If the method is DELETE, the payload should be a queryStringObject instead
        let queryStringObject = method == 'DELETE' ? payload : {}

        // Call the API
        app.client.request(undefined,path,method,queryStringObject,payload,(statusCode,responsePayload) => {
          // Display an error on the form if needed
          if(statusCode !== 200){

            if(statusCode == 403){
              // log the user out
              app.logUserOut()

            } else {

              // Try to get the error from the api, or set a default error message
              let error = typeof(responsePayload.Error) == 'string' ? responsePayload.Error : 'An error has occured, please try again'

              // Set the formError field with the error text
              document.querySelector("#"+formId+" .formError").innerHTML = error

              // Show (unhide) the form error field on the form
              document.querySelector("#"+formId+" .formError").style.display = 'block'
            }
          } else {
            // If successful, send to form response processor
            app.formResponseProcessor(formId,payload,responsePayload)
          }

        })
      })
    }
  }
}

// Form response processor
app.formResponseProcessor = (formId,requestPayload,responsePayload) => {
  let functionToCall = false
  // If account creation was successful, try to immediately log the user in
  if(formId == 'accountCreate'){
    // Take the phone and password, and use it to log the user in
    let newPayload = {
      'email' : requestPayload.email,
      'password' : requestPayload.password
    }

    app.client.request(undefined,'api/login','POST',undefined,newPayload,(newStatusCode,newResponsePayload) => {
      // Display an error on the form if needed
      if(newStatusCode !== 200){

        // Set the formError field with the error text
        document.querySelector("#"+formId+" .formError").innerHTML = 'Sorry, an error has occured. Please try again.'

        // Show (unhide) the form error field on the form
        document.querySelector("#"+formId+" .formError").style.display = 'block'

      } else {
        // If successful, set the token and redirect the user
        app.setSessionToken(newResponsePayload)
        window.location = '/dashboard/menu'
      }
    })
  }
  // If login was successful, set the token in localstorage and redirect the user
  if(formId == 'sessionCreate'){
    app.setSessionToken(responsePayload)
    window.location = '/dashboard/menu'
  }

  // If forms saved successfully and they have success messages, show them
  let formsWithSuccessMessages = ['accountEdit1', 'accountEdit2','checksEdit1']
  if(formsWithSuccessMessages.indexOf(formId) > -1){
    document.querySelector("#"+formId+" .formSuccess").style.display = 'block'
  }

  // If the user just deleted their account, redirect them to the account-delete page
  if(formId == 'accountEdit3'){
    app.logUserOut(false)
    window.location = '/account/deleted'
  }

  // If the user just created a new check successfully, redirect back to the dashboard
  if(formId == 'checksCreate'){
    window.location = '/checks/all'
  }

  // If the user just deleted a check, redirect them to the dashboard
  if(formId == 'checksEdit2'){
    window.location = '/checks/all'
  }

}

// Get the session token from localstorage and set it in the app.config object
app.getSessionToken = () => {
  let tokenString = localStorage.getItem('token')
  if(typeof(tokenString) == 'string'){
    try{
      let token = JSON.parse(tokenString)
      app.config.sessionToken = token
      if(typeof(token) == 'object'){
        app.setLoggedInClass(true)
      } else {
        app.setLoggedInClass(false)
      }
    }catch(e){
      app.config.sessionToken = false
      app.setLoggedInClass(false)
    }
  }
}

// Set (or remove) the loggedIn class from the body
app.setLoggedInClass = (add) => {
  let target = document.querySelector("body")
  if(add){
    target.classList.add('loggedIn')
  } else {
    target.classList.remove('loggedIn')
  }
}

// Set the session token in the app.config object as well as localstorage
app.setSessionToken = (token) => {
  app.config.sessionToken = token
  let tokenString = JSON.stringify(token)
  localStorage.setItem('token',tokenString)
  if(typeof(token) == 'object'){
    app.setLoggedInClass(true)
  } else {
    app.setLoggedInClass(false)
  }
}

// Renew the token
app.renewToken = (callback) => {
  let currentToken = typeof(app.config.sessionToken) == 'object' ? app.config.sessionToken : false
  if(currentToken){
    // Update the token with a new expiration
    let payload = {
      'id' : currentToken.id,
      'extend' : true,
    }
    app.client.request(undefined,'api/tokens','PUT',undefined,payload,(statusCode,responsePayload) =>{
      // Display an error on the form if needed
      if(statusCode == 200){
        // Get the new token details
        let queryStringObject = {'id' : currentToken.id}
        app.client.request(undefined,'api/tokens','GET',queryStringObject,undefined,(statusCode,responsePayload) => {
          // Display an error on the form if needed
          if(statusCode == 200){
            app.setSessionToken(responsePayload)
            callback(false)
          } else {
            app.setSessionToken(false)
            callback(true)
          }
        })
      } else {
        app.setSessionToken(false)
        callback(true)
      }
    })
  } else {
    app.setSessionToken(false)
    callback(true)
  }
}

// Load data on the page
app.loadDataOnPage = () => {
  // Get the current page from the body class
  let bodyClasses = document.querySelector("body").classList
  let primaryClass = typeof(bodyClasses[0]) == 'string' ? bodyClasses[0] : false

  // Logic for account settings page
  if(primaryClass == 'accountEdit'){
    app.loadAccountEditPage()
  }

  // Logic for dashboard page
  if(primaryClass == 'menuList'){
    app.loadMenuPage()
  }

  // Logic for cart page
  if(primaryClass == 'cartList'){
    app.loadCartPage()
  }

  // Logic for check details page
  if(primaryClass == 'checksEdit'){
    app.loadChecksEditPage()
  }
}

// Load the dashboard page specifically
app.loadMenuPage = () => {
  // Get the phone number from the current token, or log the user out if none is there
  let email = typeof(app.config.sessionToken.email) == 'string' ? app.config.sessionToken.email : false
  if(email){
    // Fetch the user data
    let queryStringObject = {
      email
    }
    app.client.request(undefined,'api/menu','GET',queryStringObject,undefined,(statusCode,responsePayload) => {
      if(statusCode == 200){
        // show menu
        let menuItems = typeof(responsePayload) == 'object' && responsePayload instanceof Array && responsePayload.length > 0 ? responsePayload : []
        if(menuItems.length > 0){
          // Remove No checks message
          document.getElementById("noChecksMessage").style.display = 'none'
          // Show each created check as a new row in the table
          menuItems.forEach((item,index) => {
            let table = document.getElementById("menuListTable")
            let tr = table.insertRow(-1)
            tr.classList.add('checkRow')
            let td0 = tr.insertCell(0)
            let td1 = tr.insertCell(1)
            let td2 = tr.insertCell(2)
            let td3 = tr.insertCell(3)
            let td4 = tr.insertCell(4)
            td0.innerHTML = index+1
            td1.innerHTML = item.name
            td2.innerHTML = item.price
            td3.innerHTML = `<button id=`+item.id+` class="cta blue" onclick="app.cartActions(`+item.id+`,'update')">Add to Cart</button>`
          })
        } else {
          // Show 'you have no checks' message
          document.getElementById("noChecksMessage").style.display = 'table-row'
        }
      } else {
        // If the request comes back as something other than 200, log the user our (on the assumption that the api is temporarily down or the users token is bad)
        app.logUserOut()
      }
    })
  } else {
    app.logUserOut()
  }
}

// Load the cart page specifically
app.loadCartPage = () => {
  // Get the email number from the current token, or log the user out if none is there
  let email = typeof(app.config.sessionToken.email) == 'string' ? app.config.sessionToken.email : false
  if(email){
    // Fetch the user data
    let queryStringObject = {
      email
    }
    app.client.request(undefined,'api/cart','GET',queryStringObject,undefined,(statusCode,responsePayload) => {
      if(statusCode == 200){
        // show items in cart
        let cartItems = typeof(responsePayload) == 'object' && responsePayload instanceof Array && responsePayload.length > 0 ? responsePayload : []
        if(cartItems.length > 0){
          // Remove No checks message
          document.getElementById("emptyCartMessage").style.display = 'none'
          // calculate the total to display
          let total = 0
          // Show each created check as a new row in the table
          cartItems.forEach((item, index) => {
            let table = document.getElementById("cartListTable")
            let tr = table.insertRow(-1)
            tr.classList.add('checkRow')
            let td0 = tr.insertCell(0)
            let td1 = tr.insertCell(1)
            let td2 = tr.insertCell(2)
            let td3 = tr.insertCell(3)
            let td4 = tr.insertCell(4)
            td0.innerHTML = index+1
            td1.innerHTML = item.name
            td2.innerHTML = item.price
            td3.innerHTML = `<button id=`+item.id+` class="cta red" onclick="app.cartActions(`+item.id+`,'delete')">Remove to Cart</button>`
            total += item.price
          })
          document.getElementById("total").innerHTML = "Total is $"+ total
        } else {
          // Show 'you have no items' message
          document.getElementById("emptyCartMessage").style.display = 'table-row'
        }
      } else {
        // If the request comes back as something other than 200, log the user our (on the assumption that the api is temporarily down or the users token is bad)
        app.logUserOut()
      }
    })
  } else {
    app.logUserOut()
  }
}

// add to cart or remove from cart
app.cartActions = (id, action) => {
  id = typeof(id) == 'number' ? id : false
  action = typeof(action) == 'string' && action.length > 0 ? action :false
  if(id && action){
    let payload = {
      'email' : app.config.sessionToken.email,
      'action' : action,
      'itemId' : id
    }
    app.client.request(undefined,'api/cart','PUT',undefined,payload,(statusCode,responsePayload) => {
      if(action == 'update'){
        if(statusCode == 200){
          console.log("Added Successfully")
          // remove the add to cart button
          document.getElementById(responsePayload.id).innerHTML = "Added Successfully"
          window.location.reload()
        } else {
          alert("Item already available in cart")
          // If the request comes back as something other than 200, redirect back to dashboard
          console.log("Something Went Wrong")
        }
        // window.location.reload()
      } else {
        if(statusCode == 200){
          console.log("Deleted Successfully")
          // remove the add to cart button
          document.getElementById(responsePayload.id).innerHTML = "Deleted Successfully"
          window.location.reload()
        } else {
          alert("Item Not available in cart")
          // If the request comes back as something other than 200, redirect back to dashboard
          console.log("Something Went Wrong")
        }
      }
    })
  } else {
    window.location = '/dashboard/menu'
  }
}

// Loop to renew token often
app.tokenRenewalLoop = () => {
  setInterval(() => {
    app.renewToken((err) => {
      if(!err){
        console.log("Token renewed successfully @ "+Date.now())
      }
    })
  },1000 * 60 * 60)
}

// Init (bootstrapping)
app.init = () => {

  // Bind all form submissions
  app.bindForms()

  // Bind logout logout button
  app.bindLogoutButton()

  // Get the token from localstorage
  app.getSessionToken()

  // Renew token
  app.tokenRenewalLoop()

  // Load data on page
  app.loadDataOnPage()

}

// Call the init processes after the window loads
window.onload = ()=>{
  app.init()
}
