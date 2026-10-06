import { describe, it, expect } from "vitest";
import {
  buildComicTitle,
  cleanRealName,
  htmlToText,
  pickImageUrls,
  pickReleaseDate,
  slugify,
} from "@/server/integrations/comic-sources/comicvine/mappers";

describe("cleanRealName", () => {
  it("conserva un nombre normal", () => {
    expect(cleanRealName("Peter Benjamin Parker")).toBe("Peter Benjamin Parker");
  });

  it("recorta los espacios sobrantes", () => {
    expect(cleanRealName("Michael Morbius ")).toBe("Michael Morbius");
  });

  it('trata "None" como sin dato', () => {
    expect(cleanRealName("None")).toBeNull();
    expect(cleanRealName("none")).toBeNull();
  });

  it("descarta un nombre real igual al nombre del personaje", () => {
    expect(cleanRealName("Carnage", "Carnage")).toBeNull();
    expect(cleanRealName(" carnage ", "Carnage")).toBeNull();
    expect(cleanRealName("Cletus Kasady", "Carnage")).toBe("Cletus Kasady");
  });

  it("devuelve null para vacío, espacios o ausencia", () => {
    expect(cleanRealName("")).toBeNull();
    expect(cleanRealName("   ")).toBeNull();
    expect(cleanRealName(null)).toBeNull();
    expect(cleanRealName(undefined)).toBeNull();
  });
});

describe("htmlToText", () => {
  it("devuelve null si no hay contenido", () => {
    expect(htmlToText(null)).toBeNull();
    expect(htmlToText("")).toBeNull();
    expect(htmlToText("<p>   </p>")).toBeNull();
  });

  it("quita las etiquetas y conserva el texto", () => {
    expect(htmlToText("<p>Hola <b>mundo</b></p>")).toBe("Hola mundo");
  });

  it("convierte párrafos y saltos de línea en líneas", () => {
    expect(htmlToText("<p>Uno</p><p>Dos</p>Tres<br>Cuatro")).toBe(
      "Uno\nDos\nTres\nCuatro",
    );
  });

  it("elimina scripts y estilos con todo su contenido", () => {
    const html = "<p>Hola</p><script>alert('x')</script><style>p{color:red}</style>";
    expect(htmlToText(html)).toBe("Hola");
  });

  it("no deja etiquetas reales aunque sean maliciosas", () => {
    const result = htmlToText('<img src=x onerror="alert(1)">Hola');
    expect(result).toBe("Hola");
    expect(result).not.toContain("<");
  });

  it("decodifica entidades una sola vez", () => {
    const input = "Tom &amp; Jerry &#8217;s &quot;ok&quot; &amp;lt;";
    expect(htmlToText(input)).toBe('Tom & Jerry \u2019s "ok" &lt;');
  });

  it("recorta los textos largos sin cortar palabras", () => {
    const result = htmlToText("palabra ".repeat(500), 100);
    expect(result).not.toBeNull();
    expect(result!.length).toBeLessThanOrEqual(101);
    expect(result!.endsWith("…")).toBe(true);
  });
});

describe("buildComicTitle", () => {
  it("une serie y número", () => {
    expect(buildComicTitle("The Amazing Spider-Man", "15")).toBe(
      "The Amazing Spider-Man #15",
    );
  });

  it("admite números que no son enteros", () => {
    expect(buildComicTitle("Marvel Team-Up", "1AU")).toBe("Marvel Team-Up #1AU");
  });

  it("usa solo la serie si no hay número", () => {
    expect(buildComicTitle("Amazing Fantasy", null)).toBe("Amazing Fantasy");
    expect(buildComicTitle("Amazing Fantasy", "  ")).toBe("Amazing Fantasy");
  });
});

describe("pickReleaseDate", () => {
  it("prefiere la fecha de venta", () => {
    const date = pickReleaseDate("1962-09-01", "1962-08-31");
    expect(date?.toISOString().slice(0, 10)).toBe("1962-09-01");
  });

  it("usa la fecha de portada si falta la de venta", () => {
    const date = pickReleaseDate(null, "1962-08-31");
    expect(date?.toISOString().slice(0, 10)).toBe("1962-08-31");
  });

  it("ignora fechas inválidas", () => {
    const date = pickReleaseDate("1962-02-30", "1962-08-31");
    expect(date?.toISOString().slice(0, 10)).toBe("1962-08-31");
    expect(pickReleaseDate("0000-00-00", "")).toBeNull();
  });

  it("devuelve null si no hay ninguna fecha", () => {
    expect(pickReleaseDate(null, undefined)).toBeNull();
  });
});

describe("pickImageUrls", () => {
  it("usa la versión grande y la mediana", () => {
    const result = pickImageUrls({
      super_url: "grande",
      medium_url: "mediana",
      small_url: "pequeña",
    });
    expect(result).toEqual({ url: "grande", thumbUrl: "mediana" });
  });

  it("recurre a alternativas si falta alguna", () => {
    const result = pickImageUrls({ medium_url: "m", original_url: "o" });
    expect(result).toEqual({ url: "m", thumbUrl: "m" });
  });

  it("devuelve null si no hay imagen", () => {
    expect(pickImageUrls(null)).toEqual({ url: null, thumbUrl: null });
  });
});
describe("slugify", () => {
  it("pasa a minúsculas y sustituye los espacios por guiones", () => {
    expect(slugify("Marvel")).toBe("marvel");
    expect(slugify("Image Comics")).toBe("image-comics");
  });

  it("quita símbolos y guiones sobrantes", () => {
    expect(slugify("  Marvel Comics!  ")).toBe("marvel-comics");
  });

  it("quita los acentos", () => {
    expect(slugify("Café Édition")).toBe("cafe-edition");
  });

  it("devuelve cadena vacía si no queda nada utilizable", () => {
    expect(slugify("!!!")).toBe("");
  });
});