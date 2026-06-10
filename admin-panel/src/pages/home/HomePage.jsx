import { siteData } from "../../shared/config/OwnerData";

export default function HomePage() {
  return (
    <section className="admin-home">
     <img src={siteData.img} alt="404"/>
    </section>
  );
}
