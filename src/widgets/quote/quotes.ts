export interface Quote
{
    text: string;
    author: string;
}

// Well-known quotes with reliable attributions; doubtful ones say "atribuida a".
export const QUOTES: Quote[] = [
    { text: 'Caminante, no hay camino, se hace camino al andar.', author: 'Antonio Machado' },
    { text: 'Todo pasa y todo queda, pero lo nuestro es pasar.', author: 'Antonio Machado' },
    { text: 'Nuestras vidas son los ríos que van a dar en la mar, que es el morir.', author: 'Jorge Manrique' },
    { text: 'El que lee mucho y anda mucho, ve mucho y sabe mucho.', author: 'Miguel de Cervantes' },
    { text: '¿Qué es la vida? Una ilusión, una sombra, una ficción.', author: 'Pedro Calderón de la Barca' },
    { text: 'Lo bueno, si breve, dos veces bueno.', author: 'Baltasar Gracián' },
    { text: 'Ande yo caliente, y ríase la gente.', author: 'Luis de Góngora' },
    { text: 'Poesía eres tú.', author: 'Gustavo Adolfo Bécquer' },
    { text: 'Yo soy yo y mi circunstancia.', author: 'José Ortega y Gasset' },
    { text: 'Verde que te quiero verde.', author: 'Federico García Lorca' },
    { text: 'Es tan corto el amor, y es tan largo el olvido.', author: 'Pablo Neruda' },
    { text: 'Me gustas cuando callas porque estás como ausente.', author: 'Pablo Neruda' },
    { text: 'Gracias a la vida, que me ha dado tanto.', author: 'Violeta Parra' },
    { text: 'Hay golpes en la vida, tan fuertes… ¡Yo no sé!', author: 'César Vallejo' },
    { text: 'Yo, que me figuraba el Paraíso bajo la especie de una biblioteca.', author: 'Jorge Luis Borges' },
    { text: 'La vida no es la que uno vivió, sino la que uno recuerda y cómo la recuerda para contarla.', author: 'Gabriel García Márquez' },
    { text: 'Lo esencial es invisible a los ojos.', author: 'Antoine de Saint-Exupéry' },
    { text: 'Pienso, luego existo.', author: 'René Descartes' },
    { text: 'Si he visto más lejos es porque estoy sentado sobre los hombros de gigantes.', author: 'Isaac Newton' },
    { text: 'Vivir es lo más raro del mundo. La mayoría de la gente solo existe.', author: 'Oscar Wilde' },
    { text: 'La imaginación es más importante que el conocimiento.', author: 'Albert Einstein' },
    { text: 'Conócete a ti mismo.', author: 'Inscripción del templo de Delfos' },
    { text: 'Solo sé que no sé nada.', author: 'Atribuida a Sócrates' },
    { text: 'Nadie se baña dos veces en el mismo río.', author: 'Atribuida a Heráclito' },
];

/** The quote for a given local date: one per day, cycling through the list in order. */
export function quoteOfTheDay(date: Date): Quote
{
    const dayNumber = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
    return QUOTES[dayNumber % QUOTES.length];
}
