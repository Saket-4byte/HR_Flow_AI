import { Annotation } from "@langchain/langgraph";

/**
 * State definition for the HRFlow AI LangGraph workflow.
 * 
 * Channels:
 * - employee: Input employee leave request data
 * - policy: Output of Policy Agent
 * - workload: Output of Workload Agent
 * - burnout: Output of Burnout Agent
 * - recommendation: Output of Recommendation Agent
 * - email: Output of Email Agent
 * - audit: Output of Audit Agent
 */
export const HRWorkflowState = Annotation.Root({
  employee: Annotation({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  policy: Annotation({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  workload: Annotation({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  burnout: Annotation({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  recommendation: Annotation({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  email: Annotation({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  audit: Annotation({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
});

export default HRWorkflowState;
