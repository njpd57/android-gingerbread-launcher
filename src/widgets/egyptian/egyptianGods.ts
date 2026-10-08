import { dailyIndex } from '@/utils/daily';

// A god of ancient Egypt each day, with a message in its spirit. The hieroglyph is one tied to the
// god (its name, emblem or sacred animal; Bes, who has none, gets the protective eye of Horus), drawn
// with Noto Sans Egyptian Hieroglyphs.

export interface EgyptianGod
{
    name: string;
    /** What the god stands for, as a short title. */
    domain: string;
    glyph: string;
    message: string;
}

export const EGYPTIAN_GODS: EgyptianGod[] = [
    { name: 'Ra', domain: 'dios del sol', glyph: '\u{131F3}', message: 'Cada mañana vuelvo a salir, aunque la noche haya sido larga. Tú también: levántate y brilla.' },
    { name: 'Isis', domain: 'diosa de la magia y la maternidad', glyph: '\u{132A8}', message: 'Recompuse lo que estaba roto con paciencia y amor. Nada está tan perdido que no pueda sanarse.' },
    { name: 'Osiris', domain: 'dios del renacer', glyph: '\u{132BD}', message: 'Lo que parece un final es una semilla. Déjalo descansar y verás lo que brota.' },
    { name: 'Horus', domain: 'dios del cielo', glyph: '\u{13143}', message: 'Mira desde lo alto antes de actuar. Con la visión clara, el golpe es certero.' },
    { name: 'Thot', domain: 'dios de la sabiduría y la escritura', glyph: '\u{1315D}', message: 'Escribe lo que piensas y lo que sientes. Las palabras ordenan el caos.' },
    { name: 'Anubis', domain: 'guardián de los caminos', glyph: '\u{130E3}', message: 'Te acompaño en los cambios. No temas cruzar de una etapa a otra.' },
    { name: 'Maat', domain: 'diosa de la verdad y el orden', glyph: '\u{13184}', message: 'Que tu corazón pese como una pluma: di la verdad y actúa con justicia.' },
    { name: 'Hathor', domain: 'diosa del amor y la alegría', glyph: '\u{133E3}', message: 'Haz espacio para la música, la risa y el cariño. La alegría también es sagrada.' },
    { name: 'Bastet', domain: 'diosa del hogar y la protección', glyph: '\u{130E0}', message: 'Cuida tu casa y a los tuyos, pero no olvides descansar al sol como un gato.' },
    { name: 'Sekhmet', domain: 'diosa de la fuerza y la sanación', glyph: '\u{130ED}', message: 'Tu fuerza es grande. Úsala para sanar y proteger, no para destruir.' },
    { name: 'Ptah', domain: 'dios creador y de los artesanos', glyph: '\u{13300}', message: 'Crea con tus manos. Lo que haces con dedicación lleva tu espíritu.' },
    { name: 'Nut', domain: 'diosa del cielo nocturno', glyph: '\u{131EF}', message: 'Te cubro con mis estrellas. Descansa: la noche también trabaja por ti.' },
    { name: 'Geb', domain: 'dios de la tierra', glyph: '\u{1316C}', message: 'Pisa firme y conecta con lo concreto. Hoy conviene poner los pies en la tierra.' },
    { name: 'Shu', domain: 'dios del aire', glyph: '\u{13184}', message: 'Respira hondo. Un poco de aire y de espacio aclara cualquier problema.' },
    { name: 'Neftis', domain: 'diosa de los umbrales', glyph: '\u{13260}', message: 'Acompaña a quien lo pasa mal. Estar presente, aunque sea en silencio, sana.' },
    { name: 'Sobek', domain: 'dios del Nilo y la fertilidad', glyph: '\u{1318B}', message: 'Sé paciente como el cocodrilo en el río: el momento justo llegará.' },
    { name: 'Khnum', domain: 'dios alfarero', glyph: '\u{130DD}', message: 'Te moldeé en mi torno y aún puedes darte forma. Nunca es tarde para cambiar.' },
    { name: 'Hapi', domain: 'dios de la crecida', glyph: '\u{13217}', message: 'La abundancia llega en su temporada. Prepara la tierra para recibirla.' },
    { name: 'Khepri', domain: 'dios del sol naciente', glyph: '\u{131A3}', message: 'Empujo el sol cada día sin rendirme. Los pequeños esfuerzos diarios mueven montañas.' },
    { name: 'Seshat', domain: 'diosa de los registros y el conocimiento', glyph: '\u{132C7}', message: 'Mide, anota, planifica. Lo que se registra se puede mejorar.' },
    { name: 'Amón', domain: 'el dios oculto', glyph: '\u{131CB}', message: 'No todo se ve a simple vista. Confía en lo que se mueve en silencio a tu favor.' },
    { name: 'Tueris', domain: 'protectora de madres y niños', glyph: '\u{130EF}', message: 'Protege lo que es frágil y está naciendo, en ti y a tu alrededor.' },
    { name: 'Neit', domain: 'diosa de la caza y la estrategia', glyph: '\u{132CB}', message: 'Apunta bien antes de disparar. Una buena estrategia vale más que muchos intentos.' },
    { name: 'Uadyet', domain: 'protectora del faraón', glyph: '\u{13197}', message: 'Pon límites claros. Protegerte también es una forma de amarte.' },
    { name: 'Atón', domain: 'el disco solar', glyph: '\u{131F6}', message: 'Mis rayos terminan en manos que dan vida. Comparte tu luz con quien la necesite.' },
    { name: 'Bes', domain: 'protector del hogar y la risa', glyph: '\u{13080}', message: 'Ríete de tus miedos. La risa ahuyenta más males de los que crees.' },
];

/** Today's god and message. */
export function egyptianGodOfTheDay(date: Date): EgyptianGod
{
    return EGYPTIAN_GODS[dailyIndex(date, EGYPTIAN_GODS.length, 'egyptianGods')];
}
