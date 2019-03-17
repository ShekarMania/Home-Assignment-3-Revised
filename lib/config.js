// Config file

const config = {}

config.default = {
  envName : 'localhost',
  httpPort : 3000,
  httpsPort : 3001,
  hashingSecret : 'thereAreNoSecrets',
  stripeApiKey: 'sk_test_9xxxxxxxxxxxxxxxxxxxxxxH',
  mailgun: {
    domainName: 'sandbox2xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxd.mailgun.org',
    host: 'api.mailgun.net',
    authUsername: 'api',
    privateKey: '9xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxc-7xxxxxx5-cxxxxxx5',
    from: 'chandrasekhar@sandbox2xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxd.mailgun.org',
    to: 'chandrasekhar.kohli@gmail.com'
  },
  menuItems: [
    {
      id:1,
      name: 'Menu Item 1',
      price: 100,
    },
    {
      id:2,
      name: 'Menu Item 2',
      price: 200
    },
    {
      id:3,
      name: 'Menu Item 3',
      price: 250
    },
    {
      id:4,
      name: 'Menu Item 4',
      price: 350
    },
    {
      id:5,
      name: 'Menu Item 5',
      price: 170
    },
    {
      id:6,
      name: 'Menu Item 6',
      price: 250
    }
  ],
  templateGlobals:{
    appName:"Hello World",
    companyName : 'Just Another Company, Pvt. Ltd.',
    yearCreated : '2019',
    baseUrl : 'http://localhost:3000/'
  }
}

config.production = {
  envName : 'production',
  httpPort : 5000,
  httpsPort : 5001,
  hashingSecret : 'thereAreNoSecrets',
  stripeApiKey: 'sk_test_9xxxxxxxxxxxxxxxxxxxxxxH',
  mailgun: {
    domainName: 'sandbox2xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxd.mailgun.org',
    host: 'api.mailgun.net',
    authUsername: 'api',
    privateKey: '9xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxc-7xxxxxx5-cxxxxxx5',
    from: 'chandrasekhar@sandbox2xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxd.mailgun.org',
    to: 'chandrasekhar.kohli@gmail.com'
  },
  menuItems: [
    {
      id:1,
      name: 'Menu Item 1',
      price: 100,
    },
    {
      id:2,
      name: 'Menu Item 2',
      price: 200
    },
    {
      id:3,
      name: 'Menu Item 3',
      price: 250
    },
    {
      id:4,
      name: 'Menu Item 4',
      price: 350
    },
    {
      id:5,
      name: 'Menu Item 5',
      price: 170
    },
    {
      id:6,
      name: 'Menu Item 6',
      price: 250
    }
  ],
  templateGlobals:{
    appName:"Hello World",
    companyName : 'Just Another Company, Pvt. Ltd.',
    yearCreated : '2019',
    baseUrl : 'http://localhost:3000/'
  }
}

const chosenConfig = process.env.NODE_ENV == 'production' ? config.production : config.default

module.exports = chosenConfig
