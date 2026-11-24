
const actualizarIMC = () => {

    document.querySelector("#imc").innerHTML =
        "<img src='img/loading-gif.gif' width='150px' height='150px'>";

    let kg = parseFloat(document.querySelector("#peso").value);
    let altura = parseFloat(document.querySelector("#estatura").value);
    let metros = altura / 100;

    document.querySelector("#vp").innerHTML =
        `<b style="color: #d7a86e">${kg}</b>`;

    document.querySelector("#ve").innerHTML =
        `<b style="color: #9bbbd1">${altura}</b>`;

    let resultado = kg / (metros * metros);

    let categorias = document.querySelectorAll("tbody tr");

    categorias.forEach(elemento => {
        elemento.style.border = "none";
        elemento.style.transform = "scale(1)";
        elemento.style.boxShadow = "none";
    });

    let categoriaActual;

    if (resultado < 18.5) {
        categoriaActual = 0;
    } else if (resultado < 25) {
        categoriaActual = 1;
    } else if (resultado < 30) {
        categoriaActual = 2;
    } else if (resultado < 35) {
        categoriaActual = 3;
    } else if (resultado < 40) {
        categoriaActual = 4;
    } else {
        categoriaActual = 5;
    }

    setTimeout(() => {

        document.querySelector("#imc").innerHTML =
            `<b style="color: #d7a86e; font-size:35px">
                ${resultado.toFixed(2)}
            </b>`;

        categorias[categoriaActual].style.border = "3px solid white";
        categorias[categoriaActual].style.transform = "scale(1.03)";
        categorias[categoriaActual].style.transition = "all 0.2s ease";
        categorias[categoriaActual].style.boxShadow =
            "0px 3px 8px rgba(0,0,0,0.4)";

    }, 300);
};


function reiniciar() {

    document.querySelector("#peso").value = 20;
    document.querySelector("#estatura").value = 100;

    document.querySelector("#vp").innerHTML = "20";
    document.querySelector("#ve").innerHTML = "100";
    document.querySelector("#imc").innerHTML = "0";

    let categorias = document.querySelectorAll("tbody tr");

    categorias.forEach(elemento => {
        elemento.style.border = "none";
        elemento.style.transform = "scale(1)";
        elemento.style.boxShadow = "none";
    });
}


document.querySelector("#peso").addEventListener("input", actualizarIMC);
document.querySelector("#estatura").addEventListener("input", actualizarIMC);
document.querySelector("#reset").addEventListener("click", reiniciar);
