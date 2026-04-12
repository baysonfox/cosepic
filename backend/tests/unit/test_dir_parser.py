"""Unit tests for directory name parser."""

from app.services.dir_parser import CharacterParsed, parse_dir_name


class TestBasicParsing:
    def test_single_coser_single_character(self):
        r = parse_dir_name("Hokunaimeko - 明日方舟 - Kafka 12p")
        assert r is not None
        assert r.coser_names == ["Hokunaimeko"]
        assert r.work_name == "明日方舟"
        assert len(r.characters) == 1
        assert r.characters[0].name == "Kafka"
        assert r.characters[0].outfit is None
        assert r.photo_count == 12
        assert r.video_count == 0

    def test_with_video_count(self):
        r = parse_dir_name("Coser - Work - Char 24p 2v")
        assert r.photo_count == 24
        assert r.video_count == 2

    def test_case_insensitive_stats(self):
        r = parse_dir_name("Coser - Work - Char 10P 3V")
        assert r.photo_count == 10
        assert r.video_count == 3


class TestMultipleEntities:
    def test_multiple_cosers(self):
        r = parse_dir_name("CoserA,CoserB - 原神 - 甘雨 24p")
        assert r.coser_names == ["CoserA", "CoserB"]

    def test_multiple_cosers_with_spaces(self):
        r = parse_dir_name("CoserA, CoserB - Work - Char 10p")
        assert r.coser_names == ["CoserA", "CoserB"]

    def test_multiple_characters(self):
        r = parse_dir_name("Coser - 原神 - 甘雨,申鹤 24p 2v")
        assert len(r.characters) == 2
        assert r.characters[0].name == "甘雨"
        assert r.characters[1].name == "申鹤"

    def test_multiple_characters_with_spaces(self):
        r = parse_dir_name("Coser - Work - CharA, CharB 10p")
        assert len(r.characters) == 2
        assert r.characters[0].name == "CharA"
        assert r.characters[1].name == "CharB"


class TestOutfitParsing:
    def test_character_with_outfit(self):
        r = parse_dir_name("Hokunaimeko - 明日方舟 - Kafka 泳装 12p")
        assert r.characters[0].name == "Kafka"
        assert r.characters[0].outfit == "泳装"

    def test_character_without_outfit(self):
        r = parse_dir_name("Coser - Work - Amiya 10p")
        assert r.characters[0].outfit is None

    def test_multiple_characters_mixed_outfit(self):
        r = parse_dir_name("Coser - Work - Kafka 泳装,Amiya 10p")
        assert r.characters[0] == CharacterParsed(name="Kafka", outfit="泳装")
        assert r.characters[1] == CharacterParsed(name="Amiya", outfit=None)

    def test_outfit_with_multiple_words(self):
        r = parse_dir_name("Coser - Work - Kafka 花嫁Ver.2 12p")
        assert r.characters[0].name == "Kafka"
        assert r.characters[0].outfit == "花嫁Ver.2"


class TestEdgeCases:
    def test_returns_none_for_empty_string(self):
        assert parse_dir_name("") is None

    def test_returns_none_for_too_few_parts(self):
        assert parse_dir_name("just-a-name") is None
        assert parse_dir_name("Coser - Work") is None

    def test_no_stats_suffix(self):
        r = parse_dir_name("Coser - Work - Char")
        assert r is not None
        assert r.photo_count == 0
        assert r.video_count == 0

    def test_extra_dashes_in_characters(self):
        """If more than 3 dash-separated parts, extras go to characters."""
        r = parse_dir_name("Coser - Work - Char - Extra 10p")
        assert r is not None
        assert r.characters[0].name == "Char"
        assert r.title == "Char - Extra"

    def test_title_equals_characters_part(self):
        r = parse_dir_name("Coser - Work - Kafka 泳装 12p")
        assert r.title == "Kafka 泳装"

    def test_original_work_uses_original_character_placeholder(self):
        r = parse_dir_name("Coser - 原创 - 白兔女仆 12p")
        assert r is not None
        assert r.work_name == "原创"
        assert r.title == "白兔女仆"
        assert r.characters == [CharacterParsed(name="OriginalCharacter")]

    def test_whitespace_handling(self):
        r = parse_dir_name("  Coser  -  Work  -  Char  10p  ")
        assert r.coser_names == ["Coser"]
        assert r.work_name == "Work"
        assert r.characters[0].name == "Char"
