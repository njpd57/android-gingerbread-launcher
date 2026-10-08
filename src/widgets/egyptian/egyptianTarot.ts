import { dailyIndex } from '@/utils/daily';

// The 22 major arcana of the Egyptian tarot, by the names the Spanish-language decks give them
// ("El Regreso" is the 22nd, the Fool of other decks). The card is drawn by the launcher: the arcanum's
// number and a hieroglyph (Noto Sans Egyptian Hieroglyphs, see ./hieroglyphs.scss) standing for it.

/** The ankh on the back of the cards. */
export const ANKH = '\u{132F9}';

export interface EgyptianArcanum
{
    number: number;
    roman: string;
    name: string;
    /** Its other traditional name. */
    alias: string;
    glyph: string;
    message: string;
}

export const EGYPTIAN_ARCANA: EgyptianArcanum[] = [
    {
        number: 1, roman: 'I', name: 'El Mago', alias: 'La Voluntad', glyph: '\u{1315D}',
        message: 'Tu voluntad abre caminos. Empieza hoy eso que vienes pensando: tienes la capacidad.',
    },
    {
        number: 2, roman: 'II', name: 'La Sacerdotisa', alias: 'La Ciencia Oculta', glyph: '\u{132A8}',
        message: 'Guarda silencio y observa. Lo que necesitas saber llegará por la intuición, no por la prisa.',
    },
    {
        number: 3, roman: 'III', name: 'La Emperatriz', alias: 'Isis Urania', glyph: '\u{13150}',
        message: 'Es tiempo de crear y hacer crecer. Cuida tus proyectos como una madre cuida a sus hijos.',
    },
    {
        number: 4, roman: 'IV', name: 'El Emperador', alias: 'La Piedra Cúbica', glyph: '\u{132FE}',
        message: 'Construye sobre bases firmes. El orden y la constancia te darán lo que buscas.',
    },
    {
        number: 5, roman: 'V', name: 'El Jerarca', alias: 'El Maestro de los Arcanos', glyph: '\u{132B9}',
        message: 'Busca consejo en quien sabe más. Un buen maestro, o tu propia conciencia, te guía hoy.',
    },
    {
        number: 6, roman: 'VI', name: 'La Indecisión', alias: 'Los Dos Caminos', glyph: '\u{130BB}',
        message: 'Dos caminos se abren. No elijas por miedo ni por impulso: elige lo que te hace crecer.',
    },
    {
        number: 7, roman: 'VII', name: 'La Victoria', alias: 'El Carro de Osiris', glyph: '\u{13143}',
        message: 'El triunfo está cerca si dominas tus impulsos y mantienes el rumbo.',
    },
    {
        number: 8, roman: 'VIII', name: 'La Justicia', alias: 'Las Balanzas', glyph: '\u{13184}',
        message: 'Maat pesa cada acción. Obra con rectitud y recibirás lo justo.',
    },
    {
        number: 9, roman: 'IX', name: 'La Prudencia', alias: 'La Lámpara Velada', glyph: '\u{13079}',
        message: 'Avanza despacio y con la luz de tu experiencia. Hoy la prudencia vale más que la audacia.',
    },
    {
        number: 10, roman: 'X', name: 'La Retribución', alias: 'La Esfinge', glyph: '\u{131A3}',
        message: 'Recibes lo que sembraste. La rueda gira: lo bueno que diste vuelve a ti.',
    },
    {
        number: 11, roman: 'XI', name: 'La Persuasión', alias: 'El León Domado', glyph: '\u{130ED}',
        message: 'La suavidad vence a la fuerza. Con paciencia y buenas palabras lograrás lo que quieres.',
    },
    {
        number: 12, roman: 'XII', name: 'El Apostolado', alias: 'El Sacrificio', glyph: '\u{132B5}',
        message: 'Da sin esperar nada a cambio. Lo que entregas con generosidad te engrandece.',
    },
    {
        number: 13, roman: 'XIII', name: 'La Inmortalidad', alias: 'La Guadaña', glyph: '\u{132F9}',
        message: 'Nada muere del todo: todo se transforma. Deja atrás lo viejo y renace.',
    },
    {
        number: 14, roman: 'XIV', name: 'La Temperancia', alias: 'Las Dos Urnas', glyph: '\u{13217}',
        message: 'Mezcla con medida. El equilibrio entre dar y recibir trae paz.',
    },
    {
        number: 15, roman: 'XV', name: 'La Pasión', alias: 'Tifón', glyph: '\u{13193}',
        message: 'Una pasión fuerte te mueve. Úsala para crear, no dejes que te domine.',
    },
    {
        number: 16, roman: 'XVI', name: 'La Fragilidad', alias: 'La Torre Fulminada', glyph: '\u{13274}',
        message: 'Lo que no tiene cimientos cae. No temas: es la oportunidad de construir mejor.',
    },
    {
        number: 17, roman: 'XVII', name: 'La Esperanza', alias: 'La Estrella de los Magos', glyph: '\u{131FC}',
        message: 'Una estrella te guía. Confía: tus deseos sinceros encuentran su camino.',
    },
    {
        number: 18, roman: 'XVIII', name: 'El Crepúsculo', alias: 'Las Tinieblas', glyph: '\u{131F9}',
        message: 'Hay sombras y engaños alrededor. Mira bien antes de confiar.',
    },
    {
        number: 19, roman: 'XIX', name: 'La Inspiración', alias: 'La Luz Resplandeciente', glyph: '\u{131F6}',
        message: 'La luz de Ra te ilumina. Las ideas fluyen: es un día para brillar.',
    },
    {
        number: 20, roman: 'XX', name: 'La Resurrección', alias: 'El Despertar de los Muertos', glyph: '\u{132BD}',
        message: 'Como Osiris, vuelves a levantarte. Algo que dabas por perdido renace.',
    },
    {
        number: 21, roman: 'XXI', name: 'La Transmutación', alias: 'La Corona de los Magos', glyph: '\u{13376}',
        message: 'Un ciclo se cierra y te transforma. Lo que aprendiste ya es parte de ti.',
    },
    {
        number: 22, roman: 'XXII', name: 'El Regreso', alias: 'El Cocodrilo', glyph: '\u{1318A}',
        message: 'Vuelves al punto de partida con más sabiduría. Cuidado con los descuidos del camino.',
    },
];

/** Today's arcanum (the Egyptian tarot is read upright). */
export function egyptianArcanumOfTheDay(date: Date): EgyptianArcanum
{
    return EGYPTIAN_ARCANA[dailyIndex(date, EGYPTIAN_ARCANA.length, 'egyptianTarot')];
}
