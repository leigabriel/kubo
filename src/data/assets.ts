export interface Asset {
  id: string;
  index: string;
  title: string;
  description: string;
  src: string;
  sizeMB: number;
  format: string;
}

export const assets: Asset[] = [
  {
    id: "coke-classic",
    index: "001",
    title: "Coke Classic",
    description:
      "The original 12oz soda can, procedurally modelled with image-projected textures. Compact, high detail and ready for product renders.",
    src: "/assets/models/coke-classic.glb",
    sizeMB: 2.6,
    format: "GLB",
  },
  {
    id: "coke-zero",
    index: "002",
    title: "Coke Zero",
    description:
      "Zero sugar, full flavour. A lightweight lathe-rendered can with crisp label projection, optimised for fast loading in browsers.",
    src: "/assets/models/coke-zero.glb",
    sizeMB: 2.6,
    format: "GLB",
  },
  {
    id: "coke-light",
    index: "003",
    title: "Coke Light",
    description:
      "A lighter interpretation of the classic can, with dense texture detail for close-up favourite-viewer inspection and downloads.",
    src: "/assets/models/coke-light.glb",
    sizeMB: 3.6,
    format: "GLB",
  },
];
