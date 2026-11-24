
const mostrarTabla = () => {

    document.querySelector("#tabla").innerHTML =
        "<img src='img/loading-gif.gif' width='150px' height='150px'>";

    setTimeout(() => {

        let numero = parseInt(document.querySelector("#numero").value);

        document.querySelector("#vn").innerHTML =
            `<b style="color: #b76e45">${numero}</b>`;

        let contenido = "";

        for (let x = 1; x <= 10; x++) {

            let multiplicacion = numero * x;

            contenido += `
                <p style="color: #b76e45">
                    ${numero} x ${x} = ${multiplicacion}
                </p>
            `;
        }

        document.querySelector("#tabla").innerHTML = contenido;

    }, 500);
};


const reiniciarTabla = () => {

    document.querySelector("#numero").value = 1;
    document.querySelector("#vn").innerHTML = "1";

    document.querySelector("#tabla").innerHTML = "1 x 1 = 1";

};
