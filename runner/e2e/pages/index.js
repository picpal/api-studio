/**
 * Pages Module Export
 *
 * Page Object Model 클래스들을 중앙에서 export합니다.
 */

const LoginPage = require('./LoginPage');
const ApiTestingPage = require('./ApiTestingPage');
const UiTestingPage = require('./UiTestingPage');

module.exports = {
  LoginPage,
  ApiTestingPage,
  UiTestingPage,
};
