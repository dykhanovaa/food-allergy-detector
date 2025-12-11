from PIL import Image
import pytesseract


img = Image.open("test_img1.png")  # положите сюда любое изображение
text = pytesseract.image_to_string(img, lang='rus+eng')
print("Распознанный текст:", text)