# WCSD security and product handoff review

Reviewed September 23, 2026. This is an engineering readiness review, not a
district approval or legal compliance determination.

## Source guidance

- The U.S. Department of Education's online educational services guidance
  covers third-party apps used for school activities and calls for schools to
  evaluate privacy/security terms and what student information a provider
  collects: [Protecting Student Privacy While Using Online Educational
  Services](https://studentprivacy.ed.gov/resources/protecting-student-privacy-while-using-online-educational-services-requirements-and-best).
- NYSED lists Education Law §2-d, Part 121, FERPA, PPRA, and COPPA among the
  applicable laws and rules. Its enforcement memo says agencies must publish
  their policy, Parents' Bill of Rights, and supplemental contract information:
  [NYSED laws and guidance](https://www.nysed.gov/data-privacy-security/laws-regulations-and-guidance),
  [NYSED enforcement memo](https://www.nysed.gov/sites/default/files/data-privacy-security/memo/nysed-enforcement-state-student-privacy-law.pdf).
- OWASP MASVS separates mobile storage, authentication/authorization, network,
  and privacy controls. Use it as the engineering verification framework;
  this repository has not undergone a MASVS assessment:
  [MASVS](https://mas.owasp.org/MASVS),
  [Storage controls](https://mas.owasp.org/MASVS/05-MASVS-STORAGE),
  [Authentication controls](https://mas.owasp.org/MASVS/07-MASVS-AUTH).
- The Department of Education's FERPA vendor FAQ says a provider handling
  education-record PII must be under the agency's direct control for its use
  and maintenance, with a security plan and breach procedures:
  [Third-party service provider FAQ](https://studentprivacy.ed.gov/sites/default/files/resource_document/file/Vendor%20FAQ.pdf).
- Background research: the SPADATAS school data-protection handbook focuses
  on school data fragility, governance, and protection practices
  ([Zenodo record](https://doi.org/10.5281/zenodo.15019980)); Zinkus et al.
  survey mobile-device data protection and emphasize encryption coverage and
  cloud-synchronization risks ([arXiv:2105.12613](https://arxiv.org/abs/2105.12613)).
  These research sources inform risk framing; they are not legal requirements.

## Implemented in this pass

- Message badges and Student Today now wait for an animation frame before
  fetching course and mailbox details; the `enabled` gate is carried through
  viewer, course, and message hooks.
- Student Today shows three upcoming schedule blocks and a full-schedule link.
- Added a reusable `Section` wrapper for the fixed section-header/content
  rhythm and applied it to Today glance and schedule sections.
- Attendance stat labels and the school-days caption now meet a 12 pt floor.
- GPA accepts `null`, and parent views show an em dash/unavailable value.
- Screenshot comparison now checks 32×32 and 128×128 grayscale tiers.
- Generated API types now come from OpenAPI (`pnpm api:generate`); client
  request paths are checked against generated routes, and CI checks the
  generated file is current. Zod remains the runtime validation boundary.
- Remote HTTP mode rejects missing OIDC issuer/client configuration;
  configuration also rejects non-HTTPS OIDC issuers, malformed URLs, and
  embedded URL credentials/query/fragment. The local synthetic demo server
  remains usable without OIDC.
- Documented that app build variables are public and service/API keys belong
  in the district backend.

## Handoff blockers and limits

- **Not production-ready:** native OIDC sign in, secure token storage,
  refresh, local logout cleanup, and capability loading are implemented in
  the client. WCSD has not supplied an identity sandbox, so the flow has not
  been verified against district registration, MFA, audience, refresh, or
  revocation settings. Browser sign in still needs the district cookie service.
- No API key should be entered into this mobile app. WCSD must provide an
  authenticated HTTPS BFF endpoint; vendor keys remain server-side.
- The district must approve the data fields, vendor terms, retention,
  deletion, incident response, parent linkage, and contract disclosures before
  real records are enabled.
- No query cache is persisted. Offline student schedule storage needs explicit
  district approval and a reviewed device-storage/retention design; current
  AsyncStorage use is limited to preferences and synthetic demo selection.
- Server-side authorization on every student/class resource remains essential.
  Client route guards and IDs are not authorization controls.
- Domain normalization is partial: GPA is nullable, `User.school`,
  `Course.teacher`, and `Course.room` support multiple values. `Student.school`,
  teacher email/contact linkage, and `TeacherClass.room` still need alignment
  with WCSD source DTOs before real data is enabled.
- Parent Needs Attention, student search, and notification category/digest
  controls already exist in the prototype. Parent quick/recent access remains
  product work; notification delivery is not implemented.
- Dynamic Island, native fonts, TalkBack/VoiceOver, and physical-device
  behavior were not validated by web screenshots.

## District-provided inputs

Use `.env` only for public local configuration such as the API base URL and
OIDC issuer/client ID. Never place an API key or client secret in `.env` or an
`EXPO_PUBLIC_*` variable. Before a pilot, WCSD should supply a sandbox URL,
registered OIDC settings, synthetic accounts, authorization rules, data
retention/breach policies, and an approved vendor review.
