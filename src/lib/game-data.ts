// Made by scripts/sync-game-data.py from the game's repository: don't edit by hand.
/* eslint-disable */

type Names = { en: string; pt: string; es: string };

/** The profile pictures (public/avatars/<code>.webp). */
export const AVATARS: readonly string[] = [
  "pic_eight",
  "pic_cue_ball",
  "pic_stripe",
  "pic_rack",
  "pic_cues",
  "pic_chalk",
  "pic_trophy",
  "pic_star",
  "pic_crown",
  "pic_table",
  "pic_flame",
  "pic_bolt",
  "pic_medal",
  "pic_laurel",
  "pic_one",
  "pic_fifteen",
  "pic_fire_eight",
  "pic_spin",
  "pic_pocket",
  "pic_lamp",
  "pic_tip",
  "pic_diamond",
  "pic_shield",
  "pic_target",
  "pic_rocket",
  "pic_rosette",
  "pic_king_eight",
  "pic_cues_star",
  "pic_planet",
  "pic_comet",
  "pic_break",
  "pic_silver_cup",
  "pic_two",
  "pic_three",
  "pic_four",
  "pic_five",
  "pic_six",
  "pic_seven",
  "pic_nine",
  "pic_ten",
  "pic_eleven",
  "pic_twelve",
  "pic_thirteen",
  "pic_fourteen",
  "pic_triangle",
  "pic_bridge",
  "pic_cue_rack",
  "pic_net",
  "pic_beads",
  "pic_stopwatch",
  "pic_bank",
  "pic_curve",
  "pic_jump",
  "pic_combo",
  "pic_ghost_ball",
  "pic_kiss",
  "pic_brush",
  "pic_case",
  "pic_gold_eight",
  "pic_wings",
  "pic_podium",
  "pic_strike",
  "pic_reds",
  "pic_fire_cue"
];

/** Faces the pictures once had, each shown as one of today's pictures. */
export const RETIRED_AVATARS: Record<string, string> = {
  "sunny": "pic_two",
  "marco": "pic_three",
  "zuri": "pic_four",
  "kai": "pic_five",
  "mei": "pic_six",
  "omar": "pic_seven",
  "lena": "pic_nine",
  "theo": "pic_ten",
  "nia": "pic_eleven",
  "raul": "pic_twelve",
  "ana": "pic_thirteen",
  "joe": "pic_fourteen",
  "iris": "pic_triangle",
  "sam": "pic_bridge",
  "hugo": "pic_cue_rack",
  "lua": "pic_net",
  "duda": "pic_beads",
  "bento": "pic_stopwatch",
  "rex": "pic_bank",
  "yuki": "pic_curve",
  "malik": "pic_jump",
  "clara": "pic_combo",
  "dante": "pic_ghost_ball",
  "flor": "pic_kiss",
  "gus": "pic_brush",
  "tati": "pic_case",
  "nico": "pic_gold_eight",
  "jade": "pic_wings",
  "beto": "pic_podium",
  "vera": "pic_strike",
  "leon": "pic_reds",
  "kiara": "pic_fire_cue"
};

/** The cues of the shop: their names and colours. */
export const CUES: Record<string, { name: Names; butt: string; accent: string; ring: string; carbon: boolean }> = {
  "cue_classic": {
    "name": {
      "en": "Classic",
      "pt": "Clássico",
      "es": "Clásico"
    },
    "butt": "#23140c",
    "accent": "#141418",
    "ring": "#f0eee4",
    "carbon": false
  },
  "cue_maple": {
    "name": {
      "en": "Natural maple",
      "pt": "Maple natural",
      "es": "Arce natural"
    },
    "butt": "#c49660",
    "accent": "#785028",
    "ring": "#1e1814",
    "carbon": false
  },
  "cue_rosewood": {
    "name": {
      "en": "Rosewood",
      "pt": "Jacarandá",
      "es": "Palisandro"
    },
    "butt": "#5c2216",
    "accent": "#28120c",
    "ring": "#c8aa6e",
    "carbon": false
  },
  "cue_walnut": {
    "name": {
      "en": "Walnut",
      "pt": "Nogueira",
      "es": "Nogal"
    },
    "butt": "#462c1a",
    "accent": "#bea06e",
    "ring": "#d2c8b4",
    "carbon": false
  },
  "cue_ebony": {
    "name": {
      "en": "Ebony & silver",
      "pt": "Ébano e prata",
      "es": "Ébano y plata"
    },
    "butt": "#0e0c0c",
    "accent": "#3c3c42",
    "ring": "#c8cdd7",
    "carbon": false
  },
  "cue_zebra": {
    "name": {
      "en": "Zebrawood",
      "pt": "Zebrano",
      "es": "Zebrano"
    },
    "butt": "#966e3c",
    "accent": "#281a10",
    "ring": "#e6dcc8",
    "carbon": false
  },
  "cue_bocote": {
    "name": {
      "en": "Bocote",
      "pt": "Bocote",
      "es": "Bocote"
    },
    "butt": "#8c602c",
    "accent": "#1e140c",
    "ring": "#c8a050",
    "carbon": false
  },
  "cue_carbon": {
    "name": {
      "en": "Carbon",
      "pt": "Carbono",
      "es": "Carbono"
    },
    "butt": "#1e2024",
    "accent": "#c81e1e",
    "ring": "#1e2024",
    "carbon": false
  },
  "cue_ocean": {
    "name": {
      "en": "Deep ocean",
      "pt": "Oceano profundo",
      "es": "Océano profundo"
    },
    "butt": "#102846",
    "accent": "#3caac8",
    "ring": "#dce6f0",
    "carbon": false
  },
  "cue_cherry": {
    "name": {
      "en": "Cherry",
      "pt": "Cerejeira",
      "es": "Cerezo"
    },
    "butt": "#781a1e",
    "accent": "#f0e6d2",
    "ring": "#c8aa6e",
    "carbon": false
  },
  "cue_jade": {
    "name": {
      "en": "Jade",
      "pt": "Jade",
      "es": "Jade"
    },
    "butt": "#18503c",
    "accent": "#c8e6d2",
    "ring": "#be9646",
    "carbon": false
  },
  "cue_ivory": {
    "name": {
      "en": "Ivory inlay",
      "pt": "Marchetado de marfim",
      "es": "Incrustación de marfil"
    },
    "butt": "#ebe1c8",
    "accent": "#23140c",
    "ring": "#be9646",
    "carbon": false
  },
  "cue_tiger": {
    "name": {
      "en": "Tiger",
      "pt": "Tigre",
      "es": "Tigre"
    },
    "butt": "#c8781e",
    "accent": "#14100c",
    "ring": "#14100c",
    "carbon": false
  },
  "cue_amethyst": {
    "name": {
      "en": "Amethyst",
      "pt": "Ametista",
      "es": "Amatista"
    },
    "butt": "#3c185a",
    "accent": "#c8aaf0",
    "ring": "#dcdce6",
    "carbon": false
  },
  "cue_arctic": {
    "name": {
      "en": "Arctic carbon",
      "pt": "Carbono ártico",
      "es": "Carbono ártico"
    },
    "butt": "#d2dce4",
    "accent": "#3c8cdc",
    "ring": "#282c32",
    "carbon": false
  },
  "cue_inferno": {
    "name": {
      "en": "Inferno",
      "pt": "Inferno",
      "es": "Infierno"
    },
    "butt": "#180a08",
    "accent": "#f05a14",
    "ring": "#fac83c",
    "carbon": false
  },
  "cue_welcome": {
    "name": {
      "en": "First break",
      "pt": "Primeira saída",
      "es": "Primer saque"
    },
    "butt": "#1e2c34",
    "accent": "#28bec8",
    "ring": "#ebebe4",
    "carbon": false
  },
  "cue_phoenix": {
    "name": {
      "en": "Phoenix",
      "pt": "Fênix",
      "es": "Fénix"
    },
    "butt": "#120a08",
    "accent": "#ff6010",
    "ring": "#ffd65a",
    "carbon": true
  },
  "cue_carrara": {
    "name": {
      "en": "Carrara marble",
      "pt": "Mármore de Carrara",
      "es": "Mármol de Carrara"
    },
    "butt": "#eceae6",
    "accent": "#5c606c",
    "ring": "#c8ccd4",
    "carbon": true
  },
  "cue_dragon": {
    "name": {
      "en": "Dragon scale",
      "pt": "Escama de dragão",
      "es": "Escama de dragón"
    },
    "butt": "#082e1e",
    "accent": "#46c878",
    "ring": "#d6b048",
    "carbon": true
  },
  "cue_chrome": {
    "name": {
      "en": "Chrome",
      "pt": "Cromado",
      "es": "Cromo"
    },
    "butt": "#aab0ba",
    "accent": "#181a1e",
    "ring": "#ebeef4",
    "carbon": true
  },
  "cue_galaxy": {
    "name": {
      "en": "Galaxy",
      "pt": "Galáxia",
      "es": "Galaxia"
    },
    "butt": "#0e0822",
    "accent": "#9646dc",
    "ring": "#bec8ff",
    "carbon": true
  },
  "cue_royal": {
    "name": {
      "en": "Crown",
      "pt": "Coroa",
      "es": "Corona"
    },
    "butt": "#101646",
    "accent": "#3c78ff",
    "ring": "#ecc460",
    "carbon": true
  },
  "cue_obsidian": {
    "name": {
      "en": "Obsidian gold",
      "pt": "Obsidiana e ouro",
      "es": "Obsidiana y oro"
    },
    "butt": "#0a0a0c",
    "accent": "#e2b44a",
    "ring": "#ecc86e",
    "carbon": true
  },
  "cue_ruby": {
    "name": {
      "en": "Ruby throne",
      "pt": "Trono de rubi",
      "es": "Trono de rubí"
    },
    "butt": "#1e060a",
    "accent": "#eb1e3c",
    "ring": "#ecc460",
    "carbon": true
  },
  "cue_legend": {
    "name": {
      "en": "Legend",
      "pt": "Lenda",
      "es": "Leyenda"
    },
    "butt": "#140e0a",
    "accent": "#e6a028",
    "ring": "#fad878",
    "carbon": true
  },
  "cue_level30": {
    "name": {
      "en": "Old hand",
      "pt": "Macaco velho",
      "es": "Perro viejo"
    },
    "butt": "#3a1e10",
    "accent": "#c49654",
    "ring": "#e6d6b4",
    "carbon": false
  },
  "cue_level50": {
    "name": {
      "en": "Lifer",
      "pt": "Vida inteira",
      "es": "Toda la vida"
    },
    "butt": "#0e1016",
    "accent": "#5abee6",
    "ring": "#dcecf6",
    "carbon": true
  },
  "cue_ladder": {
    "name": {
      "en": "Tour champion",
      "pt": "Campeão do circuito",
      "es": "Campeón del circuito"
    },
    "butt": "#241234",
    "accent": "#e2ba54",
    "ring": "#faecbe",
    "carbon": false
  }
};

/** The frames of the shop (around a player's name card). */
export const FRAMES: Record<string, { name: Names; a: string; b: string; shine: boolean }> = {
  "frame_none": {
    "name": {
      "en": "No frame",
      "pt": "Sem moldura",
      "es": "Sin marco"
    },
    "a": "#000000",
    "b": "#000000",
    "shine": false
  },
  "frame_bronze": {
    "name": {
      "en": "Bronze",
      "pt": "Bronze",
      "es": "Bronce"
    },
    "a": "#b0703c",
    "b": "#6e4222",
    "shine": false
  },
  "frame_silver": {
    "name": {
      "en": "Silver",
      "pt": "Prata",
      "es": "Plata"
    },
    "a": "#d6dae2",
    "b": "#828892",
    "shine": false
  },
  "frame_gold": {
    "name": {
      "en": "Gold",
      "pt": "Ouro",
      "es": "Oro"
    },
    "a": "#f0c85a",
    "b": "#aa7828",
    "shine": true
  },
  "frame_felt": {
    "name": {
      "en": "Green felt",
      "pt": "Feltro verde",
      "es": "Fieltro verde"
    },
    "a": "#288c50",
    "b": "#104628",
    "shine": false
  },
  "frame_wood": {
    "name": {
      "en": "Mahogany",
      "pt": "Mogno",
      "es": "Caoba"
    },
    "a": "#823c22",
    "b": "#461e10",
    "shine": false
  },
  "frame_ice": {
    "name": {
      "en": "Ice",
      "pt": "Gelo",
      "es": "Hielo"
    },
    "a": "#bee6fa",
    "b": "#5aa0d2",
    "shine": true
  },
  "frame_fire": {
    "name": {
      "en": "Fire",
      "pt": "Fogo",
      "es": "Fuego"
    },
    "a": "#ffb428",
    "b": "#d22814",
    "shine": true
  },
  "frame_neon": {
    "name": {
      "en": "Neon",
      "pt": "Neon",
      "es": "Neón"
    },
    "a": "#00f0dc",
    "b": "#dc28f0",
    "shine": true
  },
  "frame_diamond": {
    "name": {
      "en": "Diamond",
      "pt": "Diamante",
      "es": "Diamante"
    },
    "a": "#e6faff",
    "b": "#8cc8ff",
    "shine": true
  },
  "frame_crown": {
    "name": {
      "en": "VIP crown",
      "pt": "Coroa VIP",
      "es": "Corona VIP"
    },
    "a": "#fad66e",
    "b": "#be8228",
    "shine": true
  },
  "frame_amethyst": {
    "name": {
      "en": "Amethyst",
      "pt": "Ametista",
      "es": "Amatista"
    },
    "a": "#c896ff",
    "b": "#6428aa",
    "shine": true
  }
};

/** The achievements: names, descriptions and medals. */
export const ACHIEVEMENTS: Record<string, { name: Names; description: Names; medal: "bronze" | "silver" | "gold" | "diamond" | "ruby" }> = {
  "games_1": {
    "name": {
      "en": "First break",
      "pt": "Primeira saída",
      "es": "Primer saque"
    },
    "description": {
      "en": "Play your first rated game.",
      "pt": "Jogue sua primeira partida valendo rating.",
      "es": "Juega tu primera partida con rating."
    },
    "medal": "bronze"
  },
  "games_10": {
    "name": {
      "en": "Regular",
      "pt": "Frequentador",
      "es": "Habitual"
    },
    "description": {
      "en": "Play 10 rated games.",
      "pt": "Jogue 10 partidas valendo rating.",
      "es": "Juega 10 partidas con rating."
    },
    "medal": "bronze"
  },
  "games_100": {
    "name": {
      "en": "Hustler",
      "pt": "Malandro da sinuca",
      "es": "Buscavidas"
    },
    "description": {
      "en": "Play 100 rated games.",
      "pt": "Jogue 100 partidas valendo rating.",
      "es": "Juega 100 partidas con rating."
    },
    "medal": "silver"
  },
  "games_500": {
    "name": {
      "en": "Pool hall legend",
      "pt": "Lenda do salão",
      "es": "Leyenda del salón"
    },
    "description": {
      "en": "Play 500 rated games.",
      "pt": "Jogue 500 partidas valendo rating.",
      "es": "Juega 500 partidas con rating."
    },
    "medal": "gold"
  },
  "games_1000": {
    "name": {
      "en": "Lives at the table",
      "pt": "Mora na mesa",
      "es": "Vive en la mesa"
    },
    "description": {
      "en": "Play 1,000 rated games.",
      "pt": "Jogue 1.000 partidas valendo rating.",
      "es": "Juega 1.000 partidas con rating."
    },
    "medal": "diamond"
  },
  "wins_1": {
    "name": {
      "en": "First blood",
      "pt": "Primeira vitória",
      "es": "Primera sangre"
    },
    "description": {
      "en": "Win a rated game.",
      "pt": "Vença uma partida valendo rating.",
      "es": "Gana una partida con rating."
    },
    "medal": "bronze"
  },
  "wins_10": {
    "name": {
      "en": "On a roll",
      "pt": "Embalado",
      "es": "En racha"
    },
    "description": {
      "en": "Win 10 rated games.",
      "pt": "Vença 10 partidas valendo rating.",
      "es": "Gana 10 partidas con rating."
    },
    "medal": "bronze"
  },
  "wins_50": {
    "name": {
      "en": "Shark",
      "pt": "Tubarão",
      "es": "Tiburón"
    },
    "description": {
      "en": "Win 50 rated games.",
      "pt": "Vença 50 partidas valendo rating.",
      "es": "Gana 50 partidas con rating."
    },
    "medal": "silver"
  },
  "wins_100": {
    "name": {
      "en": "Centurion",
      "pt": "Centurião",
      "es": "Centurión"
    },
    "description": {
      "en": "Win 100 rated games.",
      "pt": "Vença 100 partidas valendo rating.",
      "es": "Gana 100 partidas con rating."
    },
    "medal": "gold"
  },
  "wins_500": {
    "name": {
      "en": "Unstoppable",
      "pt": "Imparável",
      "es": "Imparable"
    },
    "description": {
      "en": "Win 500 rated games.",
      "pt": "Vença 500 partidas valendo rating.",
      "es": "Gana 500 partidas con rating."
    },
    "medal": "diamond"
  },
  "eight_10": {
    "name": {
      "en": "Eight is enough",
      "pt": "A oito basta",
      "es": "Con la ocho basta"
    },
    "description": {
      "en": "Win 10 rated games on the 8-ball.",
      "pt": "Vença 10 partidas valendo rating na bola 8.",
      "es": "Gana 10 partidas con rating metiendo la 8."
    },
    "medal": "bronze"
  },
  "eight_50": {
    "name": {
      "en": "Black ball",
      "pt": "Bola preta",
      "es": "Bola negra"
    },
    "description": {
      "en": "Win 50 rated games on the 8-ball.",
      "pt": "Vença 50 partidas valendo rating na bola 8.",
      "es": "Gana 50 partidas con rating metiendo la 8."
    },
    "medal": "silver"
  },
  "eight_100": {
    "name": {
      "en": "Closer",
      "pt": "Finalizador",
      "es": "Rematador"
    },
    "description": {
      "en": "Win 100 rated games on the 8-ball.",
      "pt": "Vença 100 partidas valendo rating na bola 8.",
      "es": "Gana 100 partidas con rating metiendo la 8."
    },
    "medal": "gold"
  },
  "eight_250": {
    "name": {
      "en": "Executioner",
      "pt": "Carrasco",
      "es": "Verdugo"
    },
    "description": {
      "en": "Win 250 rated games on the 8-ball.",
      "pt": "Vença 250 partidas valendo rating na bola 8.",
      "es": "Gana 250 partidas con rating metiendo la 8."
    },
    "medal": "diamond"
  },
  "rating_1300": {
    "name": {
      "en": "Skilled",
      "pt": "Habilidoso",
      "es": "Hábil"
    },
    "description": {
      "en": "Reach a rating of 1300.",
      "pt": "Alcance 1300 de rating.",
      "es": "Alcanza un rating de 1300."
    },
    "medal": "bronze"
  },
  "rating_1500": {
    "name": {
      "en": "Expert",
      "pt": "Experiente",
      "es": "Experto"
    },
    "description": {
      "en": "Reach a rating of 1500.",
      "pt": "Alcance 1500 de rating.",
      "es": "Alcanza un rating de 1500."
    },
    "medal": "silver"
  },
  "rating_1700": {
    "name": {
      "en": "Master",
      "pt": "Mestre",
      "es": "Maestro"
    },
    "description": {
      "en": "Reach a rating of 1700.",
      "pt": "Alcance 1700 de rating.",
      "es": "Alcanza un rating de 1700."
    },
    "medal": "gold"
  },
  "rating_1900": {
    "name": {
      "en": "Grandmaster",
      "pt": "Grão-mestre",
      "es": "Gran maestro"
    },
    "description": {
      "en": "Reach a rating of 1900.",
      "pt": "Alcance 1900 de rating.",
      "es": "Alcanza un rating de 1900."
    },
    "medal": "diamond"
  },
  "rating_2100": {
    "name": {
      "en": "Legend",
      "pt": "Lenda",
      "es": "Leyenda"
    },
    "description": {
      "en": "Reach a rating of 2100.",
      "pt": "Alcance 2100 de rating.",
      "es": "Alcanza un rating de 2100."
    },
    "medal": "ruby"
  },
  "streak_3": {
    "name": {
      "en": "Hat trick",
      "pt": "Trinca",
      "es": "Triplete"
    },
    "description": {
      "en": "Win 3 rated games in a row.",
      "pt": "Vença 3 partidas valendo rating seguidas.",
      "es": "Gana 3 partidas con rating seguidas."
    },
    "medal": "bronze"
  },
  "streak_5": {
    "name": {
      "en": "Hot hand",
      "pt": "Mão quente",
      "es": "Racha caliente"
    },
    "description": {
      "en": "Win 5 rated games in a row.",
      "pt": "Vença 5 partidas valendo rating seguidas.",
      "es": "Gana 5 partidas con rating seguidas."
    },
    "medal": "silver"
  },
  "streak_10": {
    "name": {
      "en": "On fire",
      "pt": "Pegando fogo",
      "es": "En llamas"
    },
    "description": {
      "en": "Win 10 rated games in a row.",
      "pt": "Vença 10 partidas valendo rating seguidas.",
      "es": "Gana 10 partidas con rating seguidas."
    },
    "medal": "ruby"
  },
  "runout_1": {
    "name": {
      "en": "Break and run",
      "pt": "Saída e limpeza",
      "es": "Saque y limpia"
    },
    "description": {
      "en": "Win a rated game from the break without your opponent getting a shot.",
      "pt": "Vença valendo rating desde a saída sem o adversário dar uma tacada.",
      "es": "Gana una partida con rating desde el saque sin que tu rival tire."
    },
    "medal": "silver"
  },
  "runout_10": {
    "name": {
      "en": "Table runner",
      "pt": "Limpa-mesa",
      "es": "Limpiamesas"
    },
    "description": {
      "en": "Break and run 10 times.",
      "pt": "Faça 10 vezes a saída e limpe a mesa.",
      "es": "Saca y limpia la mesa 10 veces."
    },
    "medal": "ruby"
  },
  "shutout_1": {
    "name": {
      "en": "Shutout",
      "pt": "Capote",
      "es": "Capote"
    },
    "description": {
      "en": "Win a rated game before your opponent sinks a ball of their group.",
      "pt": "Vença valendo rating sem o adversário fazer nem uma bola.",
      "es": "Gana una partida con rating antes de que tu rival meta una bola de su grupo."
    },
    "medal": "bronze"
  },
  "shutout_10": {
    "name": {
      "en": "Whitewash",
      "pt": "Atropelo",
      "es": "Paliza"
    },
    "description": {
      "en": "Win 10 rated shutouts.",
      "pt": "Vença 10 partidas valendo rating sem o adversário encaçapar nenhuma bola.",
      "es": "Gana 10 capotes con rating."
    },
    "medal": "gold"
  },
  "casual_25": {
    "name": {
      "en": "Just for fun",
      "pt": "Só pela diversão",
      "es": "Solo por diversión"
    },
    "description": {
      "en": "Play 25 casual games.",
      "pt": "Jogue 25 partidas amistosas.",
      "es": "Juega 25 partidas amistosas."
    },
    "medal": "bronze"
  },
  "friend_1": {
    "name": {
      "en": "Good company",
      "pt": "Boa companhia",
      "es": "Buena compañía"
    },
    "description": {
      "en": "Make a friend.",
      "pt": "Faça um amigo.",
      "es": "Haz un amigo."
    },
    "medal": "bronze"
  },
  "friend_10": {
    "name": {
      "en": "Popular",
      "pt": "Popular",
      "es": "Popular"
    },
    "description": {
      "en": "Have 10 friends.",
      "pt": "Tenha 10 amigos.",
      "es": "Ten 10 amigos."
    },
    "medal": "silver"
  },
  "tournament_play": {
    "name": {
      "en": "Competitor",
      "pt": "Competidor",
      "es": "Competidor"
    },
    "description": {
      "en": "Play in a tournament.",
      "pt": "Jogue um torneio.",
      "es": "Juega un torneo."
    },
    "medal": "bronze"
  },
  "tournament_win": {
    "name": {
      "en": "Champion",
      "pt": "Campeão",
      "es": "Campeón"
    },
    "description": {
      "en": "Win a tournament.",
      "pt": "Vença um torneio.",
      "es": "Gana un torneo."
    },
    "medal": "gold"
  },
  "tournament_win_5": {
    "name": {
      "en": "Dynasty",
      "pt": "Dinastia",
      "es": "Dinastía"
    },
    "description": {
      "en": "Win 5 tournaments.",
      "pt": "Vença 5 torneios.",
      "es": "Gana 5 torneos."
    },
    "medal": "diamond"
  },
  "golden_break": {
    "name": {
      "en": "Golden break",
      "pt": "Saída de ouro",
      "es": "Saque de oro"
    },
    "description": {
      "en": "Win a rated game by sinking only the 8-ball on the break.",
      "pt": "Vença valendo rating encaçapando só a bola 8 na saída.",
      "es": "Gana una partida con rating metiendo solo la bola 8 en el saque."
    },
    "medal": "ruby"
  },
  "veteran_30": {
    "name": {
      "en": "Familiar face",
      "pt": "Rosto conhecido",
      "es": "Cara conocida"
    },
    "description": {
      "en": "Have an account for 30 days.",
      "pt": "Tenha uma conta há 30 dias.",
      "es": "Ten una cuenta desde hace 30 días."
    },
    "medal": "bronze"
  },
  "veteran_180": {
    "name": {
      "en": "Half a year",
      "pt": "Meio ano de casa",
      "es": "Medio año"
    },
    "description": {
      "en": "Have an account for six months.",
      "pt": "Tenha uma conta há seis meses.",
      "es": "Ten una cuenta desde hace seis meses."
    },
    "medal": "silver"
  },
  "veteran_365": {
    "name": {
      "en": "First anniversary",
      "pt": "Primeiro aniversário",
      "es": "Primer aniversario"
    },
    "description": {
      "en": "Have an account for a year.",
      "pt": "Tenha uma conta há um ano.",
      "es": "Ten una cuenta desde hace un año."
    },
    "medal": "gold"
  },
  "veteran_730": {
    "name": {
      "en": "Second anniversary",
      "pt": "Segundo aniversário",
      "es": "Segundo aniversario"
    },
    "description": {
      "en": "Have an account for two years.",
      "pt": "Tenha uma conta há dois anos.",
      "es": "Ten una cuenta desde hace dos años."
    },
    "medal": "gold"
  },
  "veteran_1095": {
    "name": {
      "en": "Third anniversary",
      "pt": "Terceiro aniversário",
      "es": "Tercer aniversario"
    },
    "description": {
      "en": "Have an account for three years.",
      "pt": "Tenha uma conta há três anos.",
      "es": "Ten una cuenta desde hace tres años."
    },
    "medal": "diamond"
  },
  "veteran_1825": {
    "name": {
      "en": "Five years at the table",
      "pt": "Cinco anos de mesa",
      "es": "Cinco años en la mesa"
    },
    "description": {
      "en": "Have an account for five years.",
      "pt": "Tenha uma conta há cinco anos.",
      "es": "Ten una cuenta desde hace cinco años."
    },
    "medal": "diamond"
  },
  "level_5": {
    "name": {
      "en": "Level 5",
      "pt": "Nível 5",
      "es": "Nivel 5"
    },
    "description": {
      "en": "Reach level 5.",
      "pt": "Chegue ao nível 5.",
      "es": "Llega al nivel 5."
    },
    "medal": "bronze"
  },
  "level_10": {
    "name": {
      "en": "Level 10",
      "pt": "Nível 10",
      "es": "Nivel 10"
    },
    "description": {
      "en": "Reach level 10.",
      "pt": "Chegue ao nível 10.",
      "es": "Llega al nivel 10."
    },
    "medal": "silver"
  },
  "level_15": {
    "name": {
      "en": "Level 15",
      "pt": "Nível 15",
      "es": "Nivel 15"
    },
    "description": {
      "en": "Reach level 15.",
      "pt": "Chegue ao nível 15.",
      "es": "Llega al nivel 15."
    },
    "medal": "silver"
  },
  "level_20": {
    "name": {
      "en": "Level 20",
      "pt": "Nível 20",
      "es": "Nivel 20"
    },
    "description": {
      "en": "Reach level 20.",
      "pt": "Chegue ao nível 20.",
      "es": "Llega al nivel 20."
    },
    "medal": "gold"
  },
  "level_30": {
    "name": {
      "en": "Level 30",
      "pt": "Nível 30",
      "es": "Nivel 30"
    },
    "description": {
      "en": "Reach level 30.",
      "pt": "Chegue ao nível 30.",
      "es": "Llega al nivel 30."
    },
    "medal": "gold"
  },
  "level_40": {
    "name": {
      "en": "Level 40",
      "pt": "Nível 40",
      "es": "Nivel 40"
    },
    "description": {
      "en": "Reach level 40.",
      "pt": "Chegue ao nível 40.",
      "es": "Llega al nivel 40."
    },
    "medal": "diamond"
  },
  "level_50": {
    "name": {
      "en": "Level 50",
      "pt": "Nível 50",
      "es": "Nivel 50"
    },
    "description": {
      "en": "Reach level 50.",
      "pt": "Chegue ao nível 50.",
      "es": "Llega al nivel 50."
    },
    "medal": "diamond"
  },
  "ladder_champion": {
    "name": {
      "en": "Champion of the tour",
      "pt": "Campeão do circuito",
      "es": "Campeón del circuito"
    },
    "description": {
      "en": "Beat all fifteen opponents of the computer tour.",
      "pt": "Vença os quinze adversários do circuito contra o computador.",
      "es": "Vence a los quince rivales del circuito contra la computadora."
    },
    "medal": "diamond"
  },
  "event_halloween": {
    "name": {
      "en": "Haunted table",
      "pt": "Mesa assombrada",
      "es": "Mesa embrujada"
    },
    "description": {
      "en": "Win a rated game during Halloween (Oct 24 – Nov 2).",
      "pt": "Vença uma partida valendo rating no Halloween (24/out – 2/nov).",
      "es": "Gana una partida con rating en Halloween (24 oct – 2 nov)."
    },
    "medal": "silver"
  },
  "event_winter": {
    "name": {
      "en": "Winter league",
      "pt": "Liga de fim de ano",
      "es": "Liga de invierno"
    },
    "description": {
      "en": "Win a rated game over the holidays (Dec 15 – Jan 6).",
      "pt": "Vença uma partida valendo rating nas festas (15/dez – 6/jan).",
      "es": "Gana una partida con rating en las fiestas (15 dic – 6 ene)."
    },
    "medal": "silver"
  },
  "event_new_year": {
    "name": {
      "en": "Fireworks",
      "pt": "Fogos de artifício",
      "es": "Fuegos artificiales"
    },
    "description": {
      "en": "Win a rated game at the turn of the year (Dec 31 – Jan 1).",
      "pt": "Vença uma partida valendo rating na virada do ano (31/dez – 1/jan).",
      "es": "Gana una partida con rating en el cambio de año (31 dic – 1 ene)."
    },
    "medal": "gold"
  }
};
