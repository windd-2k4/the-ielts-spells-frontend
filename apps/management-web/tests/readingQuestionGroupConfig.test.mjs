import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultGapFillLayout,
  defaultWordLimit,
  normalizeGroupedQuestionCount,
  questionTypeUsesQuestionOptions,
  questionTypeUsesGapTemplate,
  questionTypeUsesSharedOptions,
  readingQuestionTypeDefinitions,
} from "../src/components/test-builder/readingQuestionGroupConfig.ts";

test("completion editors stay available for passage and option-bank answers", () => {
  for (const type of [
    "FILL_IN_BLANK",
    "SENTENCE_COMPLETION",
    "SUMMARY_COMPLETION",
    "NOTE_COMPLETION",
    "TABLE_COMPLETION",
    "FLOW_CHART_COMPLETION",
  ]) {
    assert.equal(questionTypeUsesGapTemplate(type, "PASSAGE"), true);
  }
  assert.equal(questionTypeUsesGapTemplate("SUMMARY_COMPLETION", "OPTION_BANK"), true);
  assert.equal(questionTypeUsesGapTemplate("MULTIPLE_CHOICE", "PASSAGE"), false);
});

test("multiple-answer groups always contain complete question-number blocks", () => {
  assert.equal(normalizeGroupedQuestionCount("MULTIPLE_ANSWERS", 1, 2), 2);
  assert.equal(normalizeGroupedQuestionCount("MULTIPLE_ANSWERS", 5, 2), 6);
  assert.equal(normalizeGroupedQuestionCount("MULTIPLE_ANSWERS", 20, 3), 18);
  assert.equal(normalizeGroupedQuestionCount("MULTIPLE_CHOICE", 5, 2), 5);
});

test("completion layouts select the expected editor", () => {
  assert.equal(defaultGapFillLayout("TABLE_COMPLETION"), "TABLE");
  assert.equal(defaultGapFillLayout("NOTE_COMPLETION"), "LIST");
  assert.equal(defaultGapFillLayout("SUMMARY_COMPLETION"), "PARAGRAPH");
});

test("every Reading question type has a usable authoring definition", () => {
  assert.equal(readingQuestionTypeDefinitions.length, 16);
  for (const definition of readingQuestionTypeDefinitions) {
    assert.ok(definition.label.trim(), `${definition.type} needs a label`);
    assert.ok(definition.defaultInstructions.trim(), `${definition.type} needs default instructions`);
    if (definition.usesWordLimit) assert.ok(defaultWordLimit(definition.type));
  }
  assert.equal(questionTypeUsesQuestionOptions("MULTIPLE_CHOICE"), true);
  assert.equal(questionTypeUsesQuestionOptions("MULTIPLE_ANSWERS"), true);
  assert.equal(questionTypeUsesSharedOptions("MATCHING_HEADINGS", "PASSAGE"), true);
  assert.equal(questionTypeUsesSharedOptions("SUMMARY_COMPLETION", "OPTION_BANK"), true);
  assert.equal(questionTypeUsesSharedOptions("SUMMARY_COMPLETION", "PASSAGE"), false);
});
