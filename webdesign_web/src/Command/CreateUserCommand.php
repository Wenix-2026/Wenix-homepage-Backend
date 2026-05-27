<?php
// src/Command/CreateUserCommand.php

namespace App\Command;

use App\Entity\Tenant\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(name: 'app:user:create', description: 'Vytvoří nového uživatele')]
class CreateUserCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserPasswordHasherInterface $passwordHasher,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('email',    null, InputOption::VALUE_REQUIRED, 'Email uživatele')
            ->addOption('password', null, InputOption::VALUE_REQUIRED, 'Heslo')
            ->addOption('role',     null, InputOption::VALUE_OPTIONAL, 'Role', 'ROLE_USER')
            ->addOption('name',     null, InputOption::VALUE_OPTIONAL, 'Jméno');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $email    = $input->getOption('email')    ?? $io->ask('Email');
        $password = $input->getOption('password');

        // Ptej se dokud nezadá heslo
        while (empty($password)) {
            $password = $io->askHidden('Heslo (min. 6 znaků)');
            if (empty($password)) {
                $io->error('Heslo nesmí být prázdné.');
            }
        }

        $role = $input->getOption('role');
        $name = $input->getOption('name');

        $user = new User();
        $user->setEmail($email);
        $user->setRoles([$role]);
        $user->setName($name);
        $user->setPassword($this->passwordHasher->hashPassword($user, $password));

        $this->em->persist($user);
        $this->em->flush();

        $io->success("Uživatel $email ($role) byl vytvořen.");
        return Command::SUCCESS;
    }
}
