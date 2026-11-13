document.querySelectorAll(".document-image").forEach(image => {
    const showDocument = () => {
        image.hidden = false;
        image.nextElementSibling.hidden = true;
        image.parentElement.href = image.src;
    };

    image.addEventListener("load", showDocument);
    image.addEventListener("error", () => {
        image.hidden = true;
        image.nextElementSibling.hidden = false;
    });

    if (image.complete && image.naturalWidth > 0) {
        showDocument();
    }
});
