Plain = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]
Cipher = ["X", "Y", "Z", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W"]



def encryptceaser(message):
    em=""
    message = message.upper()
    for i in range(len(message)):
        for j in range(len(Plain)):
            if message[i] == Plain[j]:
                em= em + Cipher[j]
            elif message[i] == " ":
                em= em + " "
    
    return em


def Dencryptceaser(message): #works are ceaser cipher ecryption (happy accident)
    message = message.upper()
    em=""
    for i in range(len(message)):
        for j in range(len(Plain)):
            if message[i] == Cipher[j]:
                em= em + Plain[j]
            elif message[i] == " ":
                em= em + " "
    return em














