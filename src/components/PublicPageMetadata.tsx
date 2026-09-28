import { Helmet } from "react-helmet-async";

/** Public routes inherit this policy; route-level Helmet can override it (e.g. 404). */
const PublicPageMetadata = () => (
  <Helmet>
    <meta name="robots" content="index, follow, max-image-preview:large" />
  </Helmet>
);

export default PublicPageMetadata;
