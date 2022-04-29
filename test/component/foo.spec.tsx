import { mount } from '@cypress/react';
import { Given, Then } from "@badeball/cypress-cucumber-preprocessor";
import { Component } from "react";

class Foo extends Component {
    render() {
        return "This is foo";
    }
}

Given('a foo', () => {
    mount(<Foo/>);
    cy.waitForReact();
});

Then('there is a foo', () => {
    cy.react("Foo");
});
