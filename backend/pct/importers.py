import csv
import io
import posixpath
import re
import unicodedata
import zipfile
from decimal import Decimal, InvalidOperation
from xml.etree import ElementTree

from alunos.models import Aluno


HEADER_ALIASES = {
    'id': 'id',
    'aluno id': 'id',
    'id aluno': 'id',
    'numero': 'numero',
    'n': 'numero',
    'no': 'numero',
    'n aluno': 'numero',
    'aluno': 'aluno',
    'nome': 'aluno',
    'nome aluno': 'aluno',
    'nota': 'nota',
}


def normalize_text(value):
    value = '' if value is None else str(value)
    normalized = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode('ascii')
    return re.sub(r'\s+', ' ', normalized).strip().lower()


def parse_note(value):
    if value is None or str(value).strip() == '':
        return None, 'Nota invalida'

    try:
        note = Decimal(str(value).strip().replace(',', '.'))
    except (InvalidOperation, ValueError):
        return None, 'Nota invalida'

    if note < 0 or note > 20:
        return None, 'Nota invalida'

    if note.as_tuple().exponent < -2:
        return None, 'Nota invalida'

    return note, ''


def read_csv(file_obj):
    raw = file_obj.read()
    text = raw.decode('utf-8-sig')
    reader = csv.DictReader(io.StringIO(text))
    return list(reader)


def _column_index(cell_ref):
    letters = ''.join(ch for ch in cell_ref if ch.isalpha())
    index = 0
    for letter in letters:
        index = index * 26 + (ord(letter.upper()) - ord('A') + 1)
    return index - 1


def read_xlsx(file_obj):
    namespaces = {
        'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
        'rel': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
        'pkg': 'http://schemas.openxmlformats.org/package/2006/relationships',
    }

    with zipfile.ZipFile(file_obj) as archive:
        shared_strings = []
        if 'xl/sharedStrings.xml' in archive.namelist():
            shared_root = ElementTree.fromstring(archive.read('xl/sharedStrings.xml'))
            for item in shared_root.findall('main:si', namespaces):
                texts = [node.text or '' for node in item.findall('.//main:t', namespaces)]
                shared_strings.append(''.join(texts))

        workbook = ElementTree.fromstring(archive.read('xl/workbook.xml'))
        first_sheet = workbook.find('main:sheets/main:sheet', namespaces)
        relationship_id = first_sheet.attrib[f'{{{namespaces["rel"]}}}id']

        rels = ElementTree.fromstring(archive.read('xl/_rels/workbook.xml.rels'))
        sheet_target = None
        for rel in rels.findall('pkg:Relationship', namespaces):
            if rel.attrib.get('Id') == relationship_id:
                sheet_target = rel.attrib['Target']
                break

        sheet_path = posixpath.normpath(posixpath.join('xl', sheet_target))
        sheet = ElementTree.fromstring(archive.read(sheet_path))

        matrix = []
        for row in sheet.findall('.//main:sheetData/main:row', namespaces):
            values = []
            for cell in row.findall('main:c', namespaces):
                index = _column_index(cell.attrib.get('r', 'A1'))
                while len(values) <= index:
                    values.append('')
                value_node = cell.find('main:v', namespaces)
                value = '' if value_node is None else value_node.text or ''
                if cell.attrib.get('t') == 's' and value:
                    value = shared_strings[int(value)]
                elif cell.attrib.get('t') == 'inlineStr':
                    inline = cell.find('main:is/main:t', namespaces)
                    value = '' if inline is None else inline.text or ''
                values[index] = value
            matrix.append(values)

    if not matrix:
        return []

    headers = [str(item).strip() for item in matrix[0]]
    rows = []
    for values in matrix[1:]:
        if not any(str(value).strip() for value in values):
            continue
        rows.append({headers[index]: values[index] if index < len(values) else '' for index in range(len(headers))})
    return rows


def read_spreadsheet(file_obj):
    filename = getattr(file_obj, 'name', '').lower()
    if filename.endswith('.csv'):
        return read_csv(file_obj)
    if filename.endswith('.xlsx'):
        return read_xlsx(file_obj)
    raise ValueError('Formato de ficheiro nao suportado. Use .xlsx ou .csv.')


def map_row(row):
    mapped = {}
    for key, value in row.items():
        alias = HEADER_ALIASES.get(normalize_text(key))
        if alias:
            mapped[alias] = value
    return mapped


def identify_student(mapped, turma):
    student_id = str(mapped.get('id') or '').strip()
    number = str(mapped.get('numero') or '').strip()
    name = str(mapped.get('aluno') or '').strip()
    normalized_name = normalize_text(name)
    queryset = Aluno.objects.filter(turma=turma)

    if student_id:
        student = queryset.filter(id=student_id).first()
        if not student:
            return None, 'Aluno nao encontrado'
        return student, ''

    if number and normalized_name:
        matches = [
            student for student in queryset.filter(numero=number)
            if normalize_text(student.nome) == normalized_name
        ]
        if len(matches) == 1:
            return matches[0], ''
        if len(matches) > 1:
            return None, 'Aluno com identificacao ambigua'
        return None, 'Aluno nao encontrado'

    if normalized_name:
        matches = [student for student in queryset if normalize_text(student.nome) == normalized_name]
        if len(matches) == 1:
            return matches[0], ''
        if len(matches) > 1:
            return None, 'Aluno com identificacao ambigua'

    return None, 'Aluno nao encontrado'


def preview_pct_results(pct, file_obj):
    rows = read_spreadsheet(file_obj)
    preview = []
    has_errors = False

    for index, row in enumerate(rows, start=2):
        mapped = map_row(row)
        student, student_error = identify_student(mapped, pct.lecionacao.turma)
        note, note_error = parse_note(mapped.get('nota'))
        errors = [error for error in (student_error, note_error) if error]
        has_errors = has_errors or bool(errors)

        preview.append({
            'linha': index,
            'aluno_id': student.id if student else None,
            'aluno': student.nome if student else str(mapped.get('aluno') or ''),
            'numero': student.numero if student else mapped.get('numero') or '',
            'nota': str(note) if note is not None else str(mapped.get('nota') or ''),
            'status': 'OK' if not errors else 'ERRO',
            'erros': errors,
        })

    return {'rows': preview, 'has_errors': has_errors}
