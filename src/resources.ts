export class Resources {
  images: {
    [key: string]: HTMLImageElement;
  } = {};

  async loadAll() {
    await Promise.all(
      Object.entries(this.images).map(
        ([key, image]) =>
          new Promise<void>((resolve) => {
            image.addEventListener("load", (e) => {
              console.log(`Loaded image "${key}"`);

              resolve();
            });
          })
      )
    );
  }

  addImage(key: string, url: string) {
    const image = document.createElement("img");

    image.src = url;
    this.images[key] = image;

    return image;
  }

  getImage(key: string) {
    return this.images[key];
  }
}
