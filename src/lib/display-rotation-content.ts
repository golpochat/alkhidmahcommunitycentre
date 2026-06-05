export interface DisplayRotationEntry {
  arabic: string;
  english: string;
  source: string;
}

/** Default entries for empty databases. */
export const DEFAULT_DISPLAY_ROTATION: DisplayRotationEntry[] = [
  {
    arabic: "إِنَّ الصَّلَاةَ تَنْهَىٰ عَنِ الْفَحْشَاءِ وَالْمُنكَرِ",
    english: "Indeed, prayer prohibits immorality and wrongdoing.",
    source: "Qur'an 29:45",
  },
  {
    arabic: "وَاذْكُرُوا اللَّهَ كَثِيرًا لَّعَلَّكُمْ تُفْلِحُونَ",
    english: "And remember Allah often that you may succeed.",
    source: "Qur'an 62:10",
  },
  {
    arabic: "خَيْرُكُمْ أَحْسَنُكُمْ أَخْلَاقًا",
    english: "The best of you are those best in character.",
    source: "Hadith — Tirmidhi",
  },
];

/** Five ayat & five hadith for TV rotation. */
export const EXTENDED_DISPLAY_ROTATION: DisplayRotationEntry[] = [
  {
    arabic:
      "يَا أَيُّهَا الَّذِينَ آمَنُوا إِذَا نُودِيَ لِلصَّلَاةِ مِن يَوْمِ الْجُمُعَةِ فَاسْعَوْا إِلَىٰ ذِكْرِ اللَّهِ وَذَرُوا الْبَيْعَ",
    english:
      "O you who believe, when the call to prayer is made on Friday, hasten to the remembrance of Allah and leave trade.",
    source: "Qur'an 62:9 — Jumu'ah",
  },
  {
    arabic: "أَقِيمُوا الصَّلَاةَ لِذِكْرِي",
    english: "Establish prayer for My remembrance.",
    source: "Qur'an 20:14 — Prayer",
  },
  {
    arabic:
      "مَّثَلُ الَّذِينَ يُنفِقُونَ أَمْوَالَهُمْ فِي سَبِيلِ اللَّهِ كَمَثَلِ حَبَّةٍ أَنبَتَتْ سَبْعَ سَنَابِلَ فِي كُلِّ سُنبُلَةٍ مِّائَةُ حَبَّةٍ",
    english:
      "The example of those who spend their wealth in the way of Allah is like a seed that grows seven ears; in each ear a hundred grains.",
    source: "Qur'an 2:261 — Charity",
  },
  {
    arabic:
      "۞ وَسَارِعُوا إِلَىٰ مَغْفِرَةٍ مِّن رَّبِّكُمْ وَجَنَّةٍ عَرْضُهَا السَّمَاوَاتُ وَالْأَرْضُ",
    english:
      "Race toward forgiveness from your Lord and a Paradise whose width is that of the heavens and the earth.",
    source: "Qur'an 3:133 — Paradise",
  },
  {
    arabic:
      "اتَّقُوا النَّارَ الَّتِي وَقُودُهَا النَّاسُ وَالْحِجَارَةُ",
    english:
      "Guard yourselves against the Fire whose fuel is people and stones, prepared for the disbelievers.",
    source: "Qur'an 2:24 — Hellfire",
  },
  {
    arabic: "خَيْرُ يَوْمٍ طَلَعَتْ عَلَيْهِ الشَّمْسُ يَوْمُ الْجُمُعَةِ",
    english:
      "The best day on which the sun has risen is Friday; on it Adam was created and on it the Hour will be established.",
    source: "Hadith — Muslim — Jumu'ah",
  },
  {
    arabic: "أَوَّلُ مَا يُحَاسَبُ بِهِ الْعَبْدُ يَوْمَ الْقِيَامَةِ الصَّلَاةُ",
    english:
      "The first thing for which a person will be held accountable on the Day of Resurrection is prayer.",
    source: "Hadith — Tirmidhi — Prayer",
  },
  {
    arabic:
      "الصَّدَقَةُ تُطْفِئُ الْخَطِيئَةَ كَمَا يُطْفِئُ الْمَاءُ النَّارَ",
    english: "Charity extinguishes sin as water extinguishes fire.",
    source: "Hadith — Tirmidhi — Sadaqah",
  },
  {
    arabic: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ",
    english: "The best of you are those who learn the Qur'an and teach it.",
    source: "Hadith — Bukhari — Qur'an",
  },
  {
    arabic: "إِنَّ الصِّدْقَ يَهْدِي إِلَى الْبِرِّ",
    english: "Truthfulness leads to righteousness, and righteousness leads to Paradise.",
    source: "Hadith — Bukhari & Muslim — Truthfulness",
  },
];

export const ALL_DISPLAY_ROTATION: DisplayRotationEntry[] = [
  ...DEFAULT_DISPLAY_ROTATION,
  ...EXTENDED_DISPLAY_ROTATION,
];
