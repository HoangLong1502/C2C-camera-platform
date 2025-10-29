module.exports = {
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy"
  },
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest"
  },
  setupFilesAfterEnv: ["@testing-library/jest-dom"]
};
