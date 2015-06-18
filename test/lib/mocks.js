var mock = require('mock-require');

mock(require.resolve('enb-xjst/node_modules/sibling'), require('./mock-sibling'));
