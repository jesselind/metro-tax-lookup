"use strict";

// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Ambiguous JSX newlines next to inline tags (React strips them). Same idea as
 * eslint-plugin-react/jsx-child-element-spacing, plus Next.js <Link>.
 */

const INLINE_ELEMENTS = new Set([
  "a",
  "abbr",
  "acronym",
  "b",
  "bdo",
  "big",
  "button",
  "cite",
  "code",
  "dfn",
  "em",
  "i",
  "img",
  "input",
  "kbd",
  "label",
  "map",
  "object",
  "q",
  "samp",
  "script",
  "select",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "textarea",
  "tt",
  "var",
  "Link",
]);

const TEXT_FOLLOWING_ELEMENT_PATTERN = /^\s*\n\s*\S/;
const TEXT_PRECEDING_ELEMENT_PATTERN = /\S\s*\n\s*$/;

function elementName(node) {
  return (
    node.openingElement &&
    node.openingElement.name &&
    node.openingElement.name.type === "JSXIdentifier" &&
    node.openingElement.name.name
  );
}

function isInlineElement(node) {
  return node.type === "JSXElement" && INLINE_ELEMENTS.has(elementName(node));
}

/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require explicit JSX spacing next to inline tags so newlines cannot glue or split prose",
    },
    schema: [],
    messages: {
      spacingAfterPrev: "Ambiguous spacing after previous element {{element}}",
      spacingBeforeNext: "Ambiguous spacing before next element {{element}}",
    },
  },
  create(context) {
    const handleJSX = (node) => {
      let lastChild = null;
      let child = null;
      for (const nextChild of [...node.children, null]) {
        if (
          (lastChild || nextChild) &&
          (!lastChild || isInlineElement(lastChild)) &&
          child &&
          (child.type === "Literal" || child.type === "JSXText") &&
          (!nextChild || isInlineElement(nextChild))
        ) {
          if (lastChild && child.value.match(TEXT_FOLLOWING_ELEMENT_PATTERN)) {
            context.report({
              node: lastChild,
              loc: lastChild.loc.end,
              messageId: "spacingAfterPrev",
              data: { element: elementName(lastChild) },
            });
          } else if (
            nextChild &&
            child.value.match(TEXT_PRECEDING_ELEMENT_PATTERN)
          ) {
            context.report({
              node: nextChild,
              loc: nextChild.loc.start,
              messageId: "spacingBeforeNext",
              data: { element: elementName(nextChild) },
            });
          }
        }
        lastChild = child;
        child = nextChild;
      }
    };

    return {
      JSXElement: handleJSX,
      JSXFragment: handleJSX,
    };
  },
};
