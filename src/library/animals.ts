import type { Lang } from '@/i18n'

// The animals library: a real photo of each animal (public/photos/animals/<id>.jpg), its name and fact from the
// lesson texts (lessons/text*.ts), and where it lives, in each language. The photos show the species the facts
// are about (e.g. a one-humped dromedary, a mute swan, an emperor penguin).

export const ANIMAL_HOMES: Record<string, Record<Lang, string>> = {
  fox: { en: 'Forests, fields and even towns in many parts of the world', de: 'Wälder, Felder und sogar Städte in vielen Teilen der Welt', fr: 'Forêts, champs et même villes, dans de nombreuses régions du monde', yo: 'Igbó, oko àti àwọn ìlú pàápàá ní ọ̀pọ̀ apá ayé' },
  owl: { en: 'Woods and parks; most owls hunt at night', de: 'Wälder und Parks; die meisten Eulen jagen nachts', fr: 'Bois et parcs ; la plupart chassent la nuit', yo: 'Igbó àti ọgbà; ọ̀pọ̀ òwìwí ń ṣọdẹ ní òru' },
  hedgehog: { en: 'Gardens, hedges and woods in Europe', de: 'Gärten, Hecken und Wälder in Europa', fr: 'Jardins, haies et bois d’Europe', yo: 'Ọgbà, ọgbà ẹ̀gún àti igbó ní Yúróòpù' },
  elephant: { en: 'Grasslands and forests in Africa and Asia', de: 'Grasland und Wälder in Afrika und Asien', fr: 'Savanes et forêts d’Afrique et d’Asie', yo: 'Pápá koríko àti igbó ní Áfíríkà àti Éṣíà' },
  giraffe: { en: 'Savannas of Africa', de: 'Savannen in Afrika', fr: 'Savanes d’Afrique', yo: 'Pápá koríko Áfíríkà' },
  penguin: { en: 'Cold seas and ice in the southern half of the world', de: 'Kalte Meere und Eis auf der Südhalbkugel', fr: 'Mers froides et glaces de l’hémisphère Sud', yo: 'Òkun tútù àti yìnyín ní ìdajì gúúsù ayé' },
  dolphin: { en: 'Seas and oceans all over the world', de: 'Meere und Ozeane auf der ganzen Welt', fr: 'Mers et océans du monde entier', yo: 'Òkun àti agbami kárí ayé' },
  lion: { en: 'Grasslands of Africa, and one forest in India', de: 'Grasland in Afrika und ein Wald in Indien', fr: 'Savanes d’Afrique, et une forêt en Inde', yo: 'Pápá koríko Áfíríkà, àti igbó kan ní India' },
  panda: { en: 'Bamboo forests in the mountains of China', de: 'Bambuswälder in den Bergen Chinas', fr: 'Forêts de bambous dans les montagnes de Chine', yo: 'Igbó oparun lórí àwọn òkè China' },
  koala: { en: 'Eucalyptus forests in Australia', de: 'Eukalyptuswälder in Australien', fr: 'Forêts d’eucalyptus en Australie', yo: 'Igbó igi yúkálíptọ́sì ní Ọsirélíà' },
  turtle: { en: 'On land, in fresh water and in the sea, almost everywhere warm', de: 'An Land, im Süßwasser und im Meer, fast überall, wo es warm ist', fr: 'Sur terre, en eau douce et en mer, presque partout où il fait chaud', yo: 'Lórí ilẹ̀, nínú omi tútù àti nínú òkun, fẹ́rẹ̀ẹ́ níbi gbogbo tó gbóná' },
  butterfly: { en: 'Meadows and gardens with flowers, on every continent but Antarctica', de: 'Wiesen und Gärten mit Blumen, auf allen Kontinenten außer der Antarktis', fr: 'Prairies et jardins fleuris, sur tous les continents sauf l’Antarctique', yo: 'Pápá àti ọgbà olódòdó, lórí gbogbo ilẹ̀ ńlá àyàfi Antarctica' },
  honeybee: { en: 'Hives in hollow trees, or ones that beekeepers build', de: 'Bienenstöcke in hohlen Bäumen oder bei Imkern', fr: 'Ruches dans des arbres creux, ou construites par les apiculteurs', yo: 'Ilé oyin nínú igi oníhò, tàbí èyí tí àwọn olùtọ́jú oyin kọ́' },
  octopus: { en: 'Rocky sea floors and coral reefs', de: 'Felsiger Meeresboden und Korallenriffe', fr: 'Fonds marins rocheux et récifs de corail', yo: 'Ìsàlẹ̀ òkun olókùúta àti òkìtì iyùn' },
  frog: { en: 'Ponds, wet meadows and gardens', de: 'Teiche, feuchte Wiesen und Gärten', fr: 'Mares, prairies humides et jardins', yo: 'Adágún omi, pápá tó tutù àti ọgbà' },
  rabbit: { en: 'Burrows under fields and meadows', de: 'Baue unter Feldern und Wiesen', fr: 'Terriers sous les champs et les prairies', yo: 'Ihò lábẹ́ oko àti pápá' },
  chipmunk: { en: 'Forests of North America', de: 'Wälder in Nordamerika', fr: 'Forêts d’Amérique du Nord', yo: 'Igbó Àríwá Amẹ́ríkà' },
  bear: { en: 'Forests and mountains in North America, Europe and Asia', de: 'Wälder und Berge in Nordamerika, Europa und Asien', fr: 'Forêts et montagnes d’Amérique du Nord, d’Europe et d’Asie', yo: 'Igbó àti òkè ní Àríwá Amẹ́ríkà, Yúróòpù àti Éṣíà' },
  tiger: { en: 'Forests and grasslands in Asia', de: 'Wälder und Grasland in Asien', fr: 'Forêts et prairies d’Asie', yo: 'Igbó àti pápá koríko ní Éṣíà' },
  zebra: { en: 'Grasslands of Africa', de: 'Grasland in Afrika', fr: 'Savanes d’Afrique', yo: 'Pápá koríko Áfíríkà' },
  kangaroo: { en: 'Grasslands and dry plains of Australia', de: 'Grasland und trockene Ebenen in Australien', fr: 'Prairies et plaines sèches d’Australie', yo: 'Pápá koríko àti ilẹ̀ gbígbẹ ní Ọsirélíà' },
  'spouting-whale': { en: 'Oceans all over the world', de: 'Ozeane auf der ganzen Welt', fr: 'Océans du monde entier', yo: 'Agbami kárí ayé' },
  parrot: { en: 'Warm forests, often in big noisy groups', de: 'Warme Wälder, oft in großen, lauten Gruppen', fr: 'Forêts chaudes, souvent en grands groupes bruyants', yo: 'Igbó gbígbóná, nígbà púpọ̀ ní agbo ńlá aláriwo' },
  flamingo: { en: 'Shallow salty lakes and lagoons', de: 'Flache Salzseen und Lagunen', fr: 'Lacs salés peu profonds et lagunes', yo: 'Adágún omi iyọ̀ tí kò jìn àti ọ̀sà' },
  snail: { en: 'Gardens, woods and damp places', de: 'Gärten, Wälder und feuchte Orte', fr: 'Jardins, bois et endroits humides', yo: 'Ọgbà, igbó àti àwọn ibi tó tutù' },
  'lady-beetle': { en: 'Gardens, meadows and fields', de: 'Gärten, Wiesen und Felder', fr: 'Jardins, prairies et champs', yo: 'Ọgbà, pápá àti oko' },
  crab: { en: 'Beaches, rocky shores and the sea floor', de: 'Strände, felsige Küsten und Meeresboden', fr: 'Plages, côtes rocheuses et fonds marins', yo: 'Etíkun, etí òkun olókùúta àti ìsàlẹ̀ òkun' },
  horse: { en: 'Farms and fields; a few herds still live wild', de: 'Bauernhöfe und Weiden; einige Herden leben noch wild', fr: 'Fermes et prés ; quelques troupeaux vivent encore en liberté', yo: 'Oko àti pápá; àwọn agbo díẹ̀ ṣì ń gbé inú igbó' },
  cow: { en: 'Farms and meadows all over the world', de: 'Bauernhöfe und Weiden auf der ganzen Welt', fr: 'Fermes et prés du monde entier', yo: 'Oko àti pápá kárí ayé' },
  hippopotamus: { en: 'Rivers and lakes in Africa', de: 'Flüsse und Seen in Afrika', fr: 'Fleuves et lacs d’Afrique', yo: 'Odò àti adágún ní Áfíríkà' },
  camel: { en: 'Deserts of North Africa and the Middle East', de: 'Wüsten in Nordafrika und im Nahen Osten', fr: 'Déserts d’Afrique du Nord et du Moyen-Orient', yo: 'Aṣálẹ̀ Àríwá Áfíríkà àti Ìlà-Oòrùn Àárín' },
  bat: { en: 'Caves, old trees and roofs; it sleeps by day', de: 'Höhlen, alte Bäume und Dächer; tagsüber schläft sie', fr: 'Grottes, vieux arbres et toits ; elle dort le jour', yo: 'Ihò àpáta, igi àtijọ́ àti òrùlé; ó ń sùn ní ọ̀sán' },
  peacock: { en: 'Forests of India and Sri Lanka, and many parks', de: 'Wälder in Indien und Sri Lanka und viele Parks', fr: 'Forêts d’Inde et du Sri Lanka, et beaucoup de parcs', yo: 'Igbó India àti Sri Lanka, àti ọ̀pọ̀ ọgbà' },
  shark: { en: 'Oceans all over the world', de: 'Ozeane auf der ganzen Welt', fr: 'Océans du monde entier', yo: 'Agbami kárí ayé' },
  sloth: { en: 'Rainforests of Central and South America', de: 'Regenwälder in Mittel- und Südamerika', fr: 'Forêts tropicales d’Amérique centrale et du Sud', yo: 'Igbó kìjikìji Àárín àti Gúúsù Amẹ́ríkà' },
  otter: { en: 'Rivers, lakes and coasts; sea otters live in the Pacific Ocean', de: 'Flüsse, Seen und Küsten; Seeotter leben im Pazifik', fr: 'Rivières, lacs et côtes ; les loutres de mer vivent dans le Pacifique', yo: 'Odò, adágún àti etí òkun; ọ̀tà omi òkun ń gbé inú Òkun Pàsífíìkì' },
  beaver: { en: 'Rivers and lakes in North America and Europe', de: 'Flüsse und Seen in Nordamerika und Europa', fr: 'Rivières et lacs d’Amérique du Nord et d’Europe', yo: 'Odò àti adágún ní Àríwá Amẹ́ríkà àti Yúróòpù' },
  seal: { en: 'Cold seas and coasts', de: 'Kalte Meere und Küsten', fr: 'Mers froides et côtes', yo: 'Òkun tútù àti etí òkun' },
  swan: { en: 'Lakes, rivers and ponds', de: 'Seen, Flüsse und Teiche', fr: 'Lacs, rivières et étangs', yo: 'Adágún, odò àti adágún kékeré' },
  mouse: { en: 'Fields, woods and houses, almost everywhere people live', de: 'Felder, Wälder und Häuser, fast überall, wo Menschen leben', fr: 'Champs, bois et maisons, presque partout où vivent les humains', yo: 'Oko, igbó àti ilé, fẹ́rẹ̀ẹ́ níbi gbogbo tí èèyàn ń gbé' },
}

/** Photo address of an animal (relative to the app). */
export const animalPhoto = (id: string) => `photos/animals/${id}.jpg`
