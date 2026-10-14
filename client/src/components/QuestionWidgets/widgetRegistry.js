import {
  SingleChoice, MultiSelect, SequenceBuilder, MatchPairs, SortBins, TypedAnswer, MicRecord,
} from "./QuestionWidgets";

export const WIDGETS = {
  tap_mcq: SingleChoice,
  true_false: SingleChoice,
  drag_to_blank: SingleChoice,
  multi_select: MultiSelect,
  drag_order: SequenceBuilder,
  tap_sequence: SequenceBuilder,
  letter_bank: SequenceBuilder,
  match_pairs: MatchPairs,
  sort_bins: SortBins,
  typed_short: TypedAnswer,
  typed_long: TypedAnswer,
  mic_record: MicRecord,
};
