import 'cypress-react-selector';

Cypress.Commands.add('testId', (selector) => {
    cy.get(`[data-testid=${selector}]`);
});

declare global {
    namespace Cypress {
        interface Chainable {
            /**
             * get DOM element by data-testid attribute
             */
            testId(selector: string): Chainable<Element>;
        }
    }
}
