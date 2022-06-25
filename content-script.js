const imgs = document.getElementsByTagName("img")
const imgsAry = [...imgs]


const src = imgsAry.map(img => {
    return img.src
});

src;

