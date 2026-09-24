# Research notes

These sources guided the client work. They do not certify this app or an unseen WCSD service.

## Mobile sign in

[RFC 8252](https://www.rfc-editor.org/rfc/rfc8252) says native sign in should use the system browser. Public mobile apps must protect the authorization code with PKCE. The app uses that pattern. WCSD still needs to test its own issuer, redirects, scopes, token audience, refresh behavior.

[OWASP MASVS](https://mas.owasp.org/MASVS) groups mobile security checks across storage, authentication, network traffic, platform behavior. A passing dependency scan covers only a small part of that work.

## Student privacy

The [Williamsville data privacy page](https://www.williamsvillek12.org/departments/technology/data-privacy-and-security) describes parent rights under district and state policy. The app remains on invented data until WCSD reviews the real service, approved fields, retention, access rules.

SciSpace surfaced a [systematic review of usable mobile privacy controls](https://doi.org/10.59200/iconic.2024.014). The paper is broad mobile app research. It supports plain explanations of privacy choices. It is not school specific evidence.

alphaXiv surfaced [research on privacy preserving data driven education](https://www.alphaxiv.org/abs/2503.13550). That work concerns learning analytics. It is useful context about student privacy, not a design requirement for this portal.

## District links

The sign in screen points to the district [data privacy page](https://www.williamsvillek12.org/departments/technology/data-privacy-and-security), a district [acceptable use policy](https://north.williamsvillek12.org/parents-students/acceptable-use-policy), plus the district [family alert help page](https://www.williamsvillek12.org/departments/communications/ealerts). WCSD should review the final destinations before a pilot.
