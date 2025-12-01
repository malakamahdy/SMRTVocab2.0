"""
WalkingWindow.py
================
The Walking Window class implements
the walking window of current_words
currently being studied by a user

Version: 3.0
Since: 11/13/2024
"""
import csv
import random
from collections import deque
import logging
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from utils import settings
from models.word import Word

class WalkingWindow:

    def __init__(self, size: int, assignment_id: str = None, student_email: str = None):
        """
        Create a walking window object of a certain maximum size
        Reads in words to current words
        
        param: size: Maximum size of the walking window
        param: assignment_id: Optional assignment ID for assignment mode
        param: student_email: Optional student email for assignment mode
        """

        self.last = 0  # Potential use of this variable to mark the back of window when words inside not at either end become learned
        self.front = self.last + (size - 1) #TODO: EDIT LAST AND FRONT TO NOT BE INTERDEPENDENT AND THEN STATS GUI WILL JUST FIND LAST
        self.size = size
        self.srs_queue = deque(maxlen=settings.SRS_QUEUE_LENGTH)
        self.assignment_id = assignment_id
        self.student_email = student_email or settings.username
        self.is_assignment_mode = assignment_id is not None
        
        if self.is_assignment_mode:
            self.words_dict = self.assignment_to_words_dict(assignment_id, student_email)
        else:
            self.words_dict = self.csv_to_words_dict(csv_name = f"{settings.username}_{settings.LANGUAGE}.csv")
        
        self.current_words = []
        self.init_current_words(self.size)

    def csv_to_words_dict(self, csv_name: str):
        """
        Reads the user's CSV file into a dictionary structure

        param: csv_name : the filepath of the user's CSV
        return: words_dict : a dictionary containing all the user's word data
        """

        csv_file = open(f"UserWords/{csv_name}", encoding = 'utf-8')
        reader = csv.DictReader(csv_file)
        words_dict = dict()
        # i = 1
        for row in reader:
            # logging.info(f"Reading row {i} of {csv_name}: {row}")
            # i += 1
            try:
                foreign = row["Foreign"]
                engl = row["English"]
                seen = int(row.get("seen", 0) or 0)
                correct = int(row.get("correct", 0) or 0)
                wrong = int(row.get("wrong", 0) or 0)
                
                # Handle known field - could be 'True'/'False' string, '1'/'0', or boolean
                known_value = row.get("known", "0")
                if isinstance(known_value, str):
                    # Handle 'True'/'False' strings or '1'/'0'
                    if known_value.lower() == 'true':
                        known = True
                    elif known_value.lower() == 'false':
                        known = False
                    else:
                        # Try to convert to int then bool
                        try:
                            known = bool(int(known_value))
                        except (ValueError, TypeError):
                            known = False
                else:
                    known = bool(known_value)
                
                words_dict[foreign] = Word(foreign, engl, seen, correct, wrong, known)
            except Exception as e:
                logging.warning(f"Error reading row from {csv_name}: {e}")
                pass
        csv_file.close()
        logging.info(f"{csv_name} loaded into dictionary.")
        return words_dict
    
    def assignment_to_words_dict(self, assignment_id: str, student_email: str):
        """
        Load words from an assignment, merging with existing progress.
        
        param: assignment_id: The assignment ID
        param: student_email: The student's email
        return: words_dict: Dictionary containing assignment words with progress
        """
        words_dict = dict()
        ASSIGNMENT_WORDS_CSV = 'ClassroomAssignmentWords.csv'
        ASSIGNMENT_PROGRESS_CSV = 'ClassroomAssignmentProgress.csv'
        
        # Load assignment words
        assignment_words = []
        if os.path.exists(ASSIGNMENT_WORDS_CSV):
            with open(ASSIGNMENT_WORDS_CSV, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row.get('assignment_id', '') == assignment_id:
                        assignment_words.append({
                            'foreign': row.get('foreign', '').strip(),
                            'english': row.get('english', '').strip()
                        })
        
        # Load existing progress for this assignment
        progress_dict = {}
        if os.path.exists(ASSIGNMENT_PROGRESS_CSV):
            with open(ASSIGNMENT_PROGRESS_CSV, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if (row.get('assignment_id', '') == assignment_id and 
                        row.get('student_email', '').strip() == student_email.strip()):
                        word_key = f"{row.get('word_foreign', '')}|{row.get('word_english', '')}"
                        progress_dict[word_key] = {
                            'count_seen': int(row.get('count_seen', 0)),
                            'count_correct': int(row.get('count_correct', 0)),
                            'count_incorrect': int(row.get('count_incorrect', 0)),
                            'is_known': row.get('is_known', '0') == '1'
                        }
        
        # Create Word objects from assignment words
        for word_data in assignment_words:
            word_key = f"{word_data['foreign']}|{word_data['english']}"
            progress = progress_dict.get(word_key, {
                'count_seen': 0,
                'count_correct': 0,
                'count_incorrect': 0,
                'is_known': False
            })
            
            words_dict[word_data['foreign']] = Word(
                word_data['foreign'],
                word_data['english'],
                progress['count_seen'],
                progress['count_correct'],
                progress['count_incorrect'],
                progress['is_known']
            )
        
        logging.info(f"Assignment {assignment_id} loaded into dictionary for {student_email}.")
        return words_dict
    
    def word_dict_to_csv(self, csv_name: str):
        """
        Save words to CSV. In assignment mode, saves to both assignment progress and personal CSV.
        """
        if self.is_assignment_mode:
            # Save to assignment progress CSV
            self.save_assignment_progress()
            # Also update personal word list (sync progress)
            self.sync_to_personal_csv(csv_name)
        else:
            # Normal save to personal CSV
            logging.info(f"Writing words_dict to UserWords/{csv_name}")
            csv_file = open(f"UserWords/{csv_name}", encoding = 'utf-8', mode="w")
            header = "Foreign,English,seen,correct,wrong,known\n"
            csv_file.write(header)
            for word in self.words_dict.values():
                row = ""
                row += f"{word.foreign}," 
                row += f"{word.english},"
                row += f"{int(word.count_seen)},"
                row += f"{int(word.count_correct)},"
                row += f"{int(word.count_incorrect)},"
                row += f"{int(word.is_known)}\n"
                csv_file.write(row)
            csv_file.close()
            logging.info(f"{csv_name} saved.")
    
    def save_assignment_progress(self):
        """Save progress to assignment progress CSV."""
        if not self.is_assignment_mode:
            return
        
        ASSIGNMENT_PROGRESS_CSV = 'ClassroomAssignmentProgress.csv'
        from datetime import datetime
        
        # Read existing progress
        existing_progress = {}
        if os.path.exists(ASSIGNMENT_PROGRESS_CSV):
            with open(ASSIGNMENT_PROGRESS_CSV, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    key = f"{row.get('assignment_id', '')}|{row.get('student_email', '')}|{row.get('word_foreign', '')}|{row.get('word_english', '')}"
                    existing_progress[key] = row
        
        # Update with current word states
        for word in self.words_dict.values():
            key = f"{self.assignment_id}|{self.student_email}|{word.foreign}|{word.english}"
            existing_progress[key] = {
                'assignment_id': self.assignment_id,
                'student_email': self.student_email,
                'word_foreign': word.foreign,
                'word_english': word.english,
                'count_seen': str(word.count_seen),
                'count_correct': str(word.count_correct),
                'count_incorrect': str(word.count_incorrect),
                'is_known': '1' if word.is_known else '0',
                'last_updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
        
        # Write all progress back
        with open(ASSIGNMENT_PROGRESS_CSV, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['assignment_id', 'student_email', 'word_foreign', 'word_english', 
                         'count_seen', 'count_correct', 'count_incorrect', 'is_known', 'last_updated']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(existing_progress.values())
        
        logging.info(f"Assignment progress saved for {self.assignment_id}")
    
    def sync_to_personal_csv(self, csv_name: str):
        """Sync assignment progress to personal word list."""
        if not self.is_assignment_mode:
            return
        
        # Read existing personal CSV
        personal_words = {}
        csv_path = f"UserWords/{csv_name}"
        if os.path.exists(csv_path):
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    foreign = row.get('Foreign', '').strip()
                    if foreign:
                        # Handle known field - could be 'True'/'False' string, '1'/'0', or boolean
                        known_value = row.get('known', '0')
                        if isinstance(known_value, str):
                            # Handle 'True'/'False' strings or '1'/'0'
                            if known_value.lower() == 'true':
                                known_bool = True
                            elif known_value.lower() == 'false':
                                known_bool = False
                            else:
                                # Try to convert to int then bool
                                try:
                                    known_bool = bool(int(known_value))
                                except (ValueError, TypeError):
                                    known_bool = False
                        else:
                            known_bool = bool(known_value)
                        
                        personal_words[foreign] = {
                            'Foreign': foreign,
                            'English': row.get('English', '').strip(),
                            'seen': int(row.get('seen', 0) or 0),
                            'correct': int(row.get('correct', 0) or 0),
                            'wrong': int(row.get('wrong', 0) or 0),
                            'known': known_bool
                        }
        
        # Update or add assignment words to personal list
        for word in self.words_dict.values():
            if word.foreign in personal_words:
                # Update existing word - take maximum values to preserve progress
                existing = personal_words[word.foreign]
                personal_words[word.foreign] = {
                    'Foreign': word.foreign,
                    'English': word.english,
                    'seen': max(existing['seen'], word.count_seen),
                    'correct': max(existing['correct'], word.count_correct),
                    'wrong': max(existing['wrong'], word.count_incorrect),
                    'known': existing['known'] or word.is_known  # If known in either, mark as known
                }
            else:
                # Add new word
                personal_words[word.foreign] = {
                    'Foreign': word.foreign,
                    'English': word.english,
                    'seen': word.count_seen,
                    'correct': word.count_correct,
                    'wrong': word.count_incorrect,
                    'known': word.is_known
                }
        
        # Write updated personal CSV
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['Foreign', 'English', 'seen', 'correct', 'wrong', 'known']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for word_data in personal_words.values():
                # Convert known boolean to 1/0 for CSV
                row = {
                    'Foreign': word_data['Foreign'],
                    'English': word_data['English'],
                    'seen': str(word_data['seen']),
                    'correct': str(word_data['correct']),
                    'wrong': str(word_data['wrong']),
                    'known': '1' if word_data['known'] else '0'
                }
                writer.writerow(row)
        
        logging.info(f"Assignment progress synced to personal CSV: {csv_name}")

    def init_current_words(self, num_words: int):
        """
        Read a specified number of words into the walking window
        from word dictionary

        param: num_words : the number of words to read
        """

        count_read:int = 0

        # For assignments, allow known words to be included for continued practice
        if self.is_assignment_mode:
            # First, try to add unknown words
            for key, word in self.words_dict.items():
                if count_read >= num_words:
                    break
                if (not word.is_known) and (len(self.current_words) < self.size):
                    self.current_words.append(word)
                    count_read += 1
            
            # If we still need more words and all are known, add known words (randomized)
            if len(self.current_words) < num_words:
                all_words = list(self.words_dict.values())
                random.shuffle(all_words)  # Randomize for continued practice
                for word in all_words:
                    if len(self.current_words) >= num_words:
                        break
                    if word not in self.current_words:
                        self.current_words.append(word)
                        count_read += 1
        else:
            # Normal mode: only add unknown words
            for key, word in self.words_dict.items():
                if count_read >= num_words: #break when num_words are added
                    break

                if (not word.is_known) and (len(self.current_words) < self.size):
                    self.current_words.append(word)
                    count_read += 1
                else:
                    self.front += 1
        
        logging.info(f"READ {len(self.current_words)} WORDS FROM words_dict: {repr(self.current_words)}")

    def get_random_words(self, count: int) -> list:
        """
        Return a random selection of unique current_words from the walking window
        Will not return more current_words than can be stored in the walking window
        Will return an empty list if walking window is empty
        For assignment mode with few words, will also pull from words_dict if needed
        For assignment mode, includes known words for continued practice

        param: count int : The number of random current_words to return
        return: A list of randomly selected Word objects
        """
        if not self.current_words:
            # For assignments, if current_words is empty, try to get from all words_dict
            if self.is_assignment_mode and self.words_dict:
                all_words = list(self.words_dict.values())
                # Randomize for continued practice
                random.shuffle(all_words)
                return random.sample(all_words, min(count, len(all_words))) if all_words else []
            return []
        
        # If we need more words than available in current_words, try to get from words_dict
        if count > len(self.current_words) and self.is_assignment_mode:
            # For assignment mode, we can use all words in the assignment (words_dict)
            # This includes known words for continued practice
            available_words = list(self.words_dict.values())
            # Filter out words that are already in current_words to avoid duplicates
            current_foreigns = {w.foreign for w in self.current_words}
            additional_words = [w for w in available_words if w.foreign not in current_foreigns]
            
            # Combine current_words with additional words
            all_available = self.current_words + additional_words
            
            if len(all_available) >= count:
                return random.sample(all_available, count)
            else:
                # If still not enough, return what we have (will be handled by frontend)
                return random.sample(all_available, len(all_available))
        
        # Normal case: return from current_words
        return random.sample(self.current_words, min(count, len(self.current_words))) if self.current_words else []

    def check_word_definition(self, flashword:Word, answer) -> bool:
        """
        Check the definition of a word in the walking window

        param: flashword Word : The word that is being translated
        param: answer : The word or string that is being checked against the translation of the flashword
        return: True if the answer matches the translation, false otherwise
        """

        #convert Word to answer string to support both flashcard types
        if isinstance(answer, Word):
            answer = answer.english if settings.FOREIGN_TO_ENGLISH else answer.foreign

        #support for both study modes is provided by the Word class
        correct:bool = (flashword.check_definition(answer))

        if correct:
            known:bool = flashword.check_if_known()

            if known:
                #remove word from walking window and get a new word
                self.remove_known_word(flashword)
                logging.info("REMOVED FROM WALKING WINDOW: " + repr(flashword))
                self.add_new_word()
            else:
                #remove word from current current_words and add to spaced repetition queue
                self.current_words.remove(flashword)
                logging.info("REMOVED FROM CURRENT WORDS: " + repr(flashword))

                #if SRS queue is full, pop a word back into the study window
                if len(self.srs_queue) == self.srs_queue.maxlen:
                    popped_word = self.srs_queue.popleft()
                    self.current_words.append(popped_word)
                    logging.info("MOVED FROM SRS QUEUE TO CURRENT WORDS: " + repr(popped_word))

                self.srs_queue.append(flashword)
                logging.info("ADDED TO SRS QUEUE: " + repr(flashword))

                #log current state
                logging.info("CURRENT WORDS: " + repr(self.current_words))
                logging.info("SRS QUEUE: " + repr(self.srs_queue))

        return correct

    def mark_word_as_known(self, flashword:Word):
        """
        Function for the mark as known button
        Mark a word as known and remove it from the window

        param: flashword : the Word to be marked as known
        """

        flashword.set_known_word()
        self.remove_known_word(flashword)
        logging.info("MARKED AS KNOWN AND REMOVED FROM WALKING WINDOW: " + repr(flashword))
        self.add_new_word()

    def remove_known_word(self, word: Word):
        """
        Function for removing "word" from window
        Follow up with add_new_word to add a new word to the window

        param: word : the Word to be removed
        """
        if word in self.current_words:
            self.current_words.remove(word)
            self.front += 1
        else:
            logging.warning(f"Attempted to remove a word not in current_words: {repr(word)}")

    def add_new_word(self):
        """
        Read in a single word from in front of the walking window
        """
        if self.is_assignment_mode:
            # For assignments, first try to add any unknown word from the assignment
            unknown_words = [w for w in self.words_dict.values() if not w.is_known and w not in self.current_words]
            if unknown_words and len(self.current_words) < self.size:
                word = random.choice(unknown_words)
                self.current_words.append(word)
                logging.info("ADDED NEW WORD FROM ASSIGNMENT: " + repr(word))
            elif len(self.current_words) < self.size:
                # If all words are known, add a known word (randomized for continued practice)
                all_words = [w for w in self.words_dict.values() if w not in self.current_words]
                if all_words:
                    word = random.choice(all_words)
                    self.current_words.append(word)
                    logging.info("ADDED KNOWN WORD FROM ASSIGNMENT (for continued practice): " + repr(word))
        else:
            # Normal mode: read from dictionary in order
            for i in range(self.front, self.front + self.size):
                if i >= len(self.words_dict):
                    break
                word = list(self.words_dict.values())[i]
                if (not word.is_known) and (len(self.current_words) < self.size):
                    self.current_words.append(word)
                    logging.info("ADDED NEW WORD: " + repr(word))
                    break

