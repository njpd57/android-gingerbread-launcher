import { dailyFlag, dailyIndex } from '@/utils/daily';

// The 22 major arcana of the Rider-Waite-Smith tarot (1909, public domain; the scans in ./cards come
// from Wikimedia Commons), with a short reading upright and reversed.

export interface TarotCard
{
    number: number;
    roman: string;
    name: string;
    keywords: string;
    upright: string;
    reversed: string;
}

export const TAROT_CARDS: TarotCard[] = [
    {
        number: 0, roman: '0', name: 'El Loco', keywords: 'comienzos, libertad, confianza',
        upright: 'Un salto al vacío que vale la pena. Empieza algo nuevo con curiosidad, aunque no tengas todo resuelto.',
        reversed: 'Cuidado con la imprudencia. Antes de lanzarte, mira dónde vas a pisar.',
    },
    {
        number: 1, roman: 'I', name: 'El Mago', keywords: 'voluntad, habilidad, acción',
        upright: 'Tienes a mano todo lo que necesitas. Es un buen día para pasar de la idea a los hechos.',
        reversed: 'Talento desperdiciado o intenciones poco claras. Revisa si estás usando bien tus recursos.',
    },
    {
        number: 2, roman: 'II', name: 'La Sacerdotisa', keywords: 'intuición, silencio, misterio',
        upright: 'La respuesta no está afuera. Escucha tu intuición y date tiempo antes de decidir.',
        reversed: 'Estás ignorando lo que sientes. Algo oculto pide ser mirado con calma.',
    },
    {
        number: 3, roman: 'III', name: 'La Emperatriz', keywords: 'abundancia, creatividad, cuidado',
        upright: 'Día fértil para crear y cuidar. Lo que siembres con cariño va a crecer.',
        reversed: 'Te estás descuidando por atender a otros. Recupera tu propio bienestar.',
    },
    {
        number: 4, roman: 'IV', name: 'El Emperador', keywords: 'orden, estructura, autoridad',
        upright: 'Pon orden y toma el control. Un plan claro y límites firmes te darán estabilidad.',
        reversed: 'Rigidez o exceso de control. Afloja un poco: no todo depende de ti.',
    },
    {
        number: 5, roman: 'V', name: 'El Hierofante', keywords: 'tradición, enseñanza, guía',
        upright: 'Apóyate en lo que ya funciona o en alguien con experiencia. Aprender de otros te ahorra camino.',
        reversed: 'Es momento de cuestionar reglas que ya no te sirven y buscar tu propia forma.',
    },
    {
        number: 6, roman: 'VI', name: 'Los Enamorados', keywords: 'amor, elección, armonía',
        upright: 'Una elección importante del corazón. Elige lo que está alineado con tus valores.',
        reversed: 'Dudas o desacuerdo en una relación. Habla con honestidad antes de decidir.',
    },
    {
        number: 7, roman: 'VII', name: 'El Carro', keywords: 'avance, determinación, victoria',
        upright: 'Avanza con decisión. Si mantienes el rumbo, llegas.',
        reversed: 'Te estás dispersando en varias direcciones. Elige una y sostenla.',
    },
    {
        number: 8, roman: 'VIII', name: 'La Fuerza', keywords: 'coraje, paciencia, dominio de sí',
        upright: 'La verdadera fuerza es la calma. Con paciencia y suavidad vas a lograr más que forzando.',
        reversed: 'Inseguridad o impulsos que se escapan. Respira antes de reaccionar.',
    },
    {
        number: 9, roman: 'IX', name: 'El Ermitaño', keywords: 'introspección, búsqueda, prudencia',
        upright: 'Un rato a solas te dará claridad. Aléjate del ruido y escúchate.',
        reversed: 'El aislamiento ya no te ayuda. Es momento de volver a conectar con otros.',
    },
    {
        number: 10, roman: 'X', name: 'La Rueda de la Fortuna', keywords: 'ciclos, cambio, destino',
        upright: 'La rueda gira a tu favor. Aprovecha el cambio en vez de resistirte.',
        reversed: 'Una racha difícil que también va a pasar. No tomes decisiones grandes desde el desánimo.',
    },
    {
        number: 11, roman: 'XI', name: 'La Justicia', keywords: 'equilibrio, verdad, responsabilidad',
        upright: 'Cada acción tiene su consecuencia. Actúa con honestidad y todo se ordenará.',
        reversed: 'Algo no es justo, o no estás asumiendo tu parte. Míralo con sinceridad.',
    },
    {
        number: 12, roman: 'XII', name: 'El Colgado', keywords: 'pausa, entrega, otra mirada',
        upright: 'Detente y mira la situación desde otro ángulo. La pausa también es avance.',
        reversed: 'Te estás sacrificando sin sentido o postergando lo inevitable. Suelta.',
    },
    {
        number: 13, roman: 'XIII', name: 'La Muerte', keywords: 'final, transformación, renovación',
        upright: 'Algo termina para que otra cosa empiece. Deja ir lo que ya cumplió su ciclo.',
        reversed: 'Te aferras a algo que ya se fue. El cambio duele menos si no lo resistes.',
    },
    {
        number: 14, roman: 'XIV', name: 'La Templanza', keywords: 'moderación, calma, sanación',
        upright: 'Busca el punto medio. Paso a paso y sin excesos, todo encaja.',
        reversed: 'Excesos o prisas que te desequilibran. Baja el ritmo.',
    },
    {
        number: 15, roman: 'XV', name: 'El Diablo', keywords: 'apego, tentación, sombra',
        upright: 'Mira qué te tiene atado: un hábito, un miedo, una relación. Reconocerlo es el primer paso.',
        reversed: 'Te estás liberando de algo que te pesaba. Sigue así.',
    },
    {
        number: 16, roman: 'XVI', name: 'La Torre', keywords: 'ruptura, sorpresa, revelación',
        upright: 'Algo se derrumba de golpe, pero lo que cae no era firme. Sobre la verdad se construye mejor.',
        reversed: 'Estás evitando un cambio necesario. Mejor enfrentarlo ahora que después.',
    },
    {
        number: 17, roman: 'XVII', name: 'La Estrella', keywords: 'esperanza, inspiración, sanación',
        upright: 'Después de la tormenta llega la calma. Confía: vas por buen camino.',
        reversed: 'Te falta fe en ti. Recuerda lo que ya lograste.',
    },
    {
        number: 18, roman: 'XVIII', name: 'La Luna', keywords: 'ilusión, miedo, intuición',
        upright: 'No todo es lo que parece. Avanza con cuidado y confía en tu instinto.',
        reversed: 'La confusión empieza a aclararse. Lo que temías pierde fuerza.',
    },
    {
        number: 19, roman: 'XIX', name: 'El Sol', keywords: 'alegría, éxito, vitalidad',
        upright: 'Día luminoso. Disfruta, comparte y deja que se vea lo mejor de ti.',
        reversed: 'La alegría está, pero algo la nubla. Busca lo simple que te hace bien.',
    },
    {
        number: 20, roman: 'XX', name: 'El Juicio', keywords: 'despertar, llamado, renacer',
        upright: 'Es hora de hacer balance y responder a un llamado. Perdona y empieza de nuevo.',
        reversed: 'Te juzgas con dureza. Aprende de lo pasado sin cargarlo para siempre.',
    },
    {
        number: 21, roman: 'XXI', name: 'El Mundo', keywords: 'plenitud, logro, cierre',
        upright: 'Un ciclo se completa con éxito. Celebra lo logrado antes de ir por lo siguiente.',
        reversed: 'Falta un último paso para cerrar. No lo dejes a medias.',
    },
];

const images = import.meta.glob<string>('./cards/tarot-*.jpg', { import: 'default', eager: true });

/** The card's scan. */
export function tarotCardImage(card: TarotCard): string
{
    return images[`./cards/tarot-${String(card.number).padStart(2, '0')}.jpg`];
}

export interface TarotDraw
{
    card: TarotCard;
    reversed: boolean;
}

/** Today's card, and whether it comes out reversed. */
export function tarotCardOfTheDay(date: Date): TarotDraw
{
    return {
        card: TAROT_CARDS[dailyIndex(date, TAROT_CARDS.length, 'tarot')],
        reversed: dailyFlag(date, 'tarot'),
    };
}
